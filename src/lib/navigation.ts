import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  FolderOpen,
  FileText,
  Gauge,
  Bell,
  Mail,
  MessageCircle,
  PackageCheck,
  PackageOpen,
  Settings,
  Ship,
  Users,
} from "lucide-react";

export const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, module: "dashboard", permission: "dashboard.read" },
  { href: "/shipments", label: "Shipments", icon: Ship, module: "shipments", permission: "shipments.view" },
  { href: "/packing-lists", label: "Packing Lists", icon: PackageOpen, module: "packing_lists", permission: "packing_lists.view" },
  { href: "/quotes", label: "Quotes", icon: FileText, module: "quotes", permission: "quotes.view" },
  { href: "/customers", label: "Customers", icon: Building2, module: "customers", permission: "customers.view" },
  { href: "/staff", label: "Staff", icon: Users, module: "staff", permission: "staff.view" },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, module: "tasks", permission: "tasks.view" },
  { href: "/accounting", label: "Accounting", icon: BarChart3, module: "accounting", permission: "accounting.view" },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2, module: "approvals", permission: "approvals.view" },
  { href: "/email", label: "Email", icon: Mail, module: "email", permission: "email.view" },
  { href: "/documents", label: "Documents", icon: FolderOpen, module: "documents", permission: "shipments.manage_documents" },
  { href: "/notifications", label: "Notifications", icon: Bell, module: "notifications", permission: "dashboard.read" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, module: "whatsapp", permission: "whatsapp.view" },
  { href: "/reports", label: "Reports", icon: FileBarChart, module: "reports", permission: "reports.view" },
  { href: "/settings", label: "Settings", icon: Settings, module: "settings", permission: "settings.view" },
];

export const quickActions = [
  { href: "/shipments/new", label: "New shipment", icon: PackageCheck, module: "shipments", permission: "shipments.create" },
  { href: "/packing-lists/new", label: "New packing list", icon: PackageOpen, module: "packing_lists", permission: "packing_lists.create" },
  { href: "/quotes/new", label: "New quote", icon: FileText, module: "quotes", permission: "quotes.create" },
  { href: "/customers/new", label: "New customer", icon: Building2, module: "customers", permission: "customers.create" },
];
