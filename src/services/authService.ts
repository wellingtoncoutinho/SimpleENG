import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
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
      return 'Este e-mail já está cadastrado. Você pode alternar para a aba "Já Tenho Conta".';
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
      streakDays: 1,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', fbUser.uid), userProfile);
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
      streakDays: 1,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };

    // Store in mock accounts list
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
    } else {
      // If doc didn't exist for some reason, create default profile
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
        streakDays: 1,
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, fallbackProfile);
      localStorage.setItem('talktune_user', JSON.stringify(fallbackProfile));
      return fallbackProfile;
    }
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

    // Default mock user if not found in list
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
      streakDays: 1,
      isAuthenticated: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('talktune_user', JSON.stringify(mockProfile));
    return mockProfile;
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
            callback({ ...profile, id: fbUser.uid, isAuthenticated: true });
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
          streakDays: 1,
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
 * Save weekly plan to Firestore
 */
export async function saveWeeklyPlanToCloud(
  userId: string,
  plan: WeeklyPlan | null
): Promise<void> {
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
 * Load weekly plan from Firestore
 */
export async function loadWeeklyPlanFromCloud(
  userId: string
): Promise<WeeklyPlan | null> {
  if (isFirebaseConfigured() && db && userId) {
    try {
      const snap = await getDoc(doc(db, 'plans', userId));
      if (snap.exists()) {
        return snap.data() as WeeklyPlan;
      }
    } catch (error) {
      console.warn('Error loading weekly plan from cloud:', error);
    }
  }
  return null;
}
