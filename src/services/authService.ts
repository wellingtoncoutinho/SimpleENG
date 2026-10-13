import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile } from '../types/user';
import { WeeklyPlan } from '../types/weeklyPlan';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  level: UserProfile['level'];
  dailyMinutesGoal: number;
  classDay: string;
  appLanguage: 'pt' | 'en';
}

/**
 * Maps Firebase Auth error codes to friendly Portuguese messages
 */
export function formatAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Alterne para a aba "Entrar" para acessar.';
    case 'auth/invalid-email':
      return 'O formato do e-mail é inválido. Por favor, verifique.';
    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este e-mail. Crie uma nova conta acima.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Por favor, tente novamente.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas consecutivas. Aguarde alguns instantes antes de tentar novamente.';
    case 'auth/network-request-failed':
      return 'Falha na conexão com a internet. Verifique sua rede.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login com o Google foi fechada antes de concluir.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela pop-up do Google. Permita pop-ups para continuar.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com este mesmo e-mail associada a outro método.';
    case 'permission-denied':
      return 'Acesso negado pelas regras do banco de dados Firebase. Atualize as regras no console do Firebase.';
    default:
      return error?.message || 'Ocorreu um erro na autenticação. Tente novamente.';
  }
}

/**
 * Register a new user in Firebase Auth & save their profile in Firestore
 */
export async function registerUser(input: RegisterInput): Promise<UserProfile> {
  const cleanEmail = input.email.trim().toLowerCase();

  if (isFirebaseConfigured() && auth && db) {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, input.password);
    const fbUser = userCredential.user;

    // 2. Set display name
    if (input.name.trim()) {
      await updateProfile(fbUser, { displayName: input.name.trim() });
    }

    // 3. Save profile document in Firestore
    const userProfile: UserProfile = {
      id: fbUser.uid,
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone ? input.phone.trim() : '',
      level: input.level,
      dailyMinutesGoal: input.dailyMinutesGoal,
      classDay: input.classDay,
      appLanguage: input.appLanguage,
      totalXp: 0,
      lessonsCompleted: 0,
      streakDays: 0,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
    } catch (dbErr) {
      console.warn('Firestore write warning:', dbErr);
    }

    localStorage.setItem('talktune_user', JSON.stringify(userProfile));
    return userProfile;
  } else {
    // Fallback: Local storage mock mode
    const mockId = 'user_' + Date.now();
    const userProfile: UserProfile = {
      id: mockId,
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone ? input.phone.trim() : '',
      level: input.level,
      dailyMinutesGoal: input.dailyMinutesGoal,
      classDay: input.classDay,
      appLanguage: input.appLanguage,
      totalXp: 0,
      lessonsCompleted: 0,
      streakDays: 0,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingRaw = localStorage.getItem('talktune_mock_users');
      const usersList = existingRaw ? JSON.parse(existingRaw) : [];
      usersList.push({ ...userProfile, password: input.password });
      localStorage.setItem('talktune_mock_users', JSON.stringify(usersList));
      localStorage.setItem('talktune_user', JSON.stringify(userProfile));
    } catch {
      // ignore
    }

    return userProfile;
  }
}

/**
 * Login user via Firebase Auth and fetch their profile from Firestore
 */
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured() && auth && db) {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        const profile: UserProfile = {
          ...data,
          id: fbUser.uid,
          isAuthenticated: true,
        };
        localStorage.setItem('talktune_user', JSON.stringify(profile));
        return profile;
      }
    } catch (e) {
      console.warn('Error reading Firestore profile:', e);
    }

    // Default profile if Firestore read failed or doc doesn't exist
    const fallbackProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: '',
      level: 'B2',
      dailyMinutesGoal: 20,
      classDay: 'Quarta-feira',
      appLanguage: 'pt',
      totalXp: 0,
      lessonsCompleted: 0,
      streakDays: 0,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(userDocRef, fallbackProfile, { merge: true });
    } catch {
      // ignore
    }
    localStorage.setItem('talktune_user', JSON.stringify(fallbackProfile));
    return fallbackProfile;
  } else {
    // Fallback: Local storage check
    try {
      const existingRaw = localStorage.getItem('talktune_mock_users');
      if (existingRaw) {
        const usersList: any[] = JSON.parse(existingRaw);
        const match = usersList.find((u) => u.email === cleanEmail);
        if (match) {
          if (match.password && match.password !== password) {
            throw new Error('Senha incorreta. Verifique e tente novamente.');
          }
          const { password: _, ...cleanProfile } = match;
          cleanProfile.isAuthenticated = true;
          localStorage.setItem('talktune_user', JSON.stringify(cleanProfile));
          return cleanProfile;
        }
      }
    } catch (e: any) {
      if (e.message.includes('Senha')) throw e;
    }

    const mockProfile: UserProfile = {
      id: 'user_' + Date.now(),
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: '',
      level: 'B2',
      dailyMinutesGoal: 20,
      classDay: 'Quarta-feira',
      appLanguage: 'pt',
      totalXp: 0,
      lessonsCompleted: 0,
      streakDays: 0,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('talktune_user', JSON.stringify(mockProfile));
    return mockProfile;
  }
}

/**
 * Login with Google 1-Click Popup
 */
export async function loginWithGoogle(): Promise<UserProfile> {
  if (isFirebaseConfigured() && auth && db) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const fbUser = userCredential.user;

    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        const profile: UserProfile = {
          ...data,
          id: fbUser.uid,
          isAuthenticated: true,
        };
        localStorage.setItem('talktune_user', JSON.stringify(profile));
        return profile;
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore:', err);
    }

    // First time Google user: create new profile
    const newProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Aluno SimpleENG',
      email: fbUser.email?.toLowerCase() || '',
      phone: fbUser.phoneNumber || '',
      level: 'B2',
      dailyMinutesGoal: 20,
      classDay: 'Quarta-feira',
      appLanguage: 'pt',
      totalXp: 0,
      lessonsCompleted: 0,
      streakDays: 0,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(userDocRef, newProfile);
    } catch (err) {
      console.warn('Could not write Google profile to Firestore:', err);
    }

    localStorage.setItem('talktune_user', JSON.stringify(newProfile));
    return newProfile;
  } else {
    // Fallback mock Google user
    const mockGoogle: UserProfile = {
      id: 'google_' + Date.now(),
      name: 'Aluno Google',
      email: 'aluno.google@gmail.com',
      phone: '',
      level: 'B2',
      dailyMinutesGoal: 20,
      classDay: 'Quarta-feira',
      appLanguage: 'pt',
      totalXp: 0,
      lessonsCompleted: 0,
      streakDays: 0,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('talktune_user', JSON.stringify(mockGoogle));
    return mockGoogle;
  }
}

/**
 * Logout user from Firebase and clear local session
 */
export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('SignOut error:', error);
    }
  }
  localStorage.removeItem('talktune_user');
}

/**
 * Listen to auth state changes (persisting user automatically)
 */
export function subscribeToAuthChanges(
  callback: (user: UserProfile | null) => void
): () => void {
  if (isFirebaseConfigured() && auth && db) {
    const firestoreDb = db;
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(firestoreDb, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            const sanitizedStreak = (profile.lessonsCompleted || 0) === 0 ? 0 : (profile.streakDays || 0);
            const cleanProfile: UserProfile = {
              ...profile,
              streakDays: sanitizedStreak,
              id: fbUser.uid,
              isAuthenticated: true,
            };
            if (profile.streakDays !== sanitizedStreak) {
              saveUserProfileToCloud(fbUser.uid, cleanProfile);
            }
            callback(cleanProfile);
            return;
          }
        } catch (error) {
          console.warn('Error fetching user profile:', error);
        }

        // Fallback profile if Firestore read failed
        callback({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Aluno',
          email: fbUser.email || '',
          level: 'B2',
          dailyMinutesGoal: 20,
          classDay: 'Quarta-feira',
          appLanguage: 'pt',
          totalXp: 0,
          lessonsCompleted: 0,
          streakDays: 0,
          isAuthenticated: true,
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Local storage check
    try {
      const saved = localStorage.getItem('talktune_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthenticated) {
          if ((parsed.lessonsCompleted || 0) === 0) {
            parsed.streakDays = 0;
            localStorage.setItem('talktune_user', JSON.stringify(parsed));
          }
          callback(parsed);
          return () => {};
        }
      }
    } catch {
      // ignore
    }
    callback(null);
    return () => {};
  }
}

/**
 * Save user profile updates to Firestore and localStorage
 */
export async function saveUserProfileToCloud(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  if (isFirebaseConfigured() && db && userId) {
    try {
      await setDoc(doc(db, 'users', userId), profile, { merge: true });
    } catch (error) {
      console.warn('Error saving user profile to cloud:', error);
    }
  }
}

/**
 * Save weekly plan to Firestore and localStorage backup
 */
export async function saveWeeklyPlanToCloud(
  userId: string,
  plan: WeeklyPlan | null
): Promise<void> {
  // Always update local backup cache immediately
  try {
    if (plan) {
      localStorage.setItem('talktune_weekly_plan', JSON.stringify(plan));
    } else {
      localStorage.removeItem('talktune_weekly_plan');
    }
  } catch {
    // ignore
  }

  // Sync to Firestore cloud
  if (isFirebaseConfigured() && db && userId) {
    try {
      const planRef = doc(db, 'plans', userId);
      if (plan) {
        await setDoc(planRef, plan);
      } else {
        await deleteDoc(planRef);
      }
    } catch (error) {
      console.warn('Error syncing weekly plan with cloud:', error);
    }
  }
}

/**
 * Load weekly plan from Firestore with fallback to localStorage
 */
export async function loadWeeklyPlanFromCloud(
  userId: string
): Promise<WeeklyPlan | null> {
  // 1. Try Firestore cloud first
  if (isFirebaseConfigured() && db && userId) {
    try {
      const snap = await getDoc(doc(db, 'plans', userId));
      if (snap.exists()) {
        const cloudPlan = snap.data() as WeeklyPlan;
        if (cloudPlan && cloudPlan.days && cloudPlan.days.length > 0) {
          localStorage.setItem('talktune_weekly_plan', JSON.stringify(cloudPlan));
          return cloudPlan;
        }
      }
    } catch (error) {
      console.warn('Error loading weekly plan from cloud:', error);
    }
  }

  // 2. Fallback to localStorage backup
  try {
    const saved = localStorage.getItem('talktune_weekly_plan');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.days && parsed.days.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return null;
}
