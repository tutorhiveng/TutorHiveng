import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
// Initialize Firestore using experimentalForceLongPolling to eliminate WebSocket / WebChannel streaming dropouts in iframe & sandboxed environments
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
); /* CRITICAL: The app will break without this line */
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// CRITICAL EXCEPTION HANDLER mandated by the firebase-integration guidelines
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error Exception: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on load as required by the checklist
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error?.code === "permission-denied") {
      // Backend is reached and active
      return;
    }
    if (
      (error instanceof Error && error.message.includes("client is offline")) ||
      error?.code === "unavailable"
    ) {
      console.warn("Firestore running in offline/long-polling mode or connection establishing.");
    }
  }
}
testConnection();
