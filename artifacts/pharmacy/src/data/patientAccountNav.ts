import {
  Home,
  Package,
  User,
  Upload,
  LineChart,
  MessageSquare,
  KeyRound,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export type PatientNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  logout?: boolean;
};

/** Sidebar links — matches everydaymeds.co.uk patient account. */
export const PATIENT_ACCOUNT_NAV: PatientNavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "My Orders", href: "/my-orders", icon: Package },
  { label: "My Account", href: "/account/profile", icon: User },
  { label: "Upload Documents", href: "/pages/upload-documents", icon: Upload },
  { label: "Progress Reviews", href: "/pages/my-tasks", icon: LineChart },
  { label: "Messages", href: "/my-messages", icon: MessageSquare },
  { label: "Change Password", href: "/account/details/password", icon: KeyRound },
  { label: "Log out", href: "/", icon: LogOut, logout: true },
];

export const ORDER_PROGRESS_STEPS = [
  "Received",
  "Documents",
  "Review",
  "Approved",
  "Dispatch",
  "Sent",
] as const;
