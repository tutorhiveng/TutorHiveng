import { InAppNotification } from "../src/types";

export let IN_APP_NOTIFICATIONS: InAppNotification[] = [
  {
    id: "notif-1",
    userId: "all",
    title: "New Video Lessons Released: JAMB Physics 2026",
    message: "12 new recorded problem-solving sessions on Electromagnetism and Nuclear Physics have been added to the syllabus archive.",
    type: "lesson",
    read: false,
    linkTab: "courses",
    linkSubTab: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: "notif-2",
    userId: "all",
    title: "Tutor Bee Math Engine Updated",
    message: "Tutor Bee now features structured mathematical step breakdown and balanced chemical equations via Gemini 3.8 Flash.",
    type: "system",
    read: false,
    linkTab: "ai",
    linkSubTab: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    id: "notif-3",
    userId: "all",
    title: "Paystack Instant Verification Online",
    message: "Seamless payment verification for subscriptions, books, and tutor sessions is enabled.",
    type: "payment",
    read: true,
    linkTab: "dashboard",
    linkSubTab: "billing",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

export function addNotification(notif: Omit<InAppNotification, "id" | "createdAt" | "read">): InAppNotification {
  const newNotif: InAppNotification = {
    ...notif,
    id: "notif-" + Date.now(),
    read: false,
    createdAt: new Date().toISOString()
  };
  IN_APP_NOTIFICATIONS.unshift(newNotif);
  // Keep memory buffer bounded to 50 items
  if (IN_APP_NOTIFICATIONS.length > 50) {
    IN_APP_NOTIFICATIONS.pop();
  }
  return newNotif;
}
