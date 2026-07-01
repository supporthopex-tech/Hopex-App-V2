import Link from "next/link";
import { inviteUser, logoutCurrentUser, saveBrandingSettings, saveCompanySettings, saveInvoiceSettings, saveLanguageSettings, saveMyAccountSettings, saveNotificationSettings } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supportedCurrencies } from "@/lib/currencies";
import type { SettingsRecord } from "@/lib/communications/types";
import type { TenantContext } from "@/lib/app-types";

const tabs = [
  ["company", "Company"], ["invoicing", "Invoicing"], ["my-account", "My Account"], ["appearance", "Appearance"],
  ["notifications", "Notifications"], ["invite-users", "Invite Users"], ["language", "Language"],
];

export function SettingsPanel({ active, settings, tenant }: { active: string; settings: SettingsRecord; tenant: TenantContext }) {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground">Manage app preferences - {tenant.company.name}</p></div>
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card><CardContent className="space-y-1 pt-6">{tabs.map(([key, label]) => <Link key={key} href={key === "company" ? "/settings" : `/settings/${key}`} className={`block rounded-md px-3 py-2 text-sm ${active === key ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}>{label}</Link>)}</CardContent></Card>
        {active === "invoicing" ? <Invoicing settings={settings} /> : active === "my-account" ? <MyAccount tenant={tenant} /> : active === "appearance" ? <Appearance settings={settings} tenant={tenant} /> : active === "notifications" ? <Notifications settings={settings} /> : active === "invite-users" ? <InviteUsers /> : active === "language" ? <Language settings={settings} /> : <Company settings={settings} />}
      </div>
    </div>
  );
}

function Company({ settings }: { settings: SettingsRecord }) {
  return <Card><CardHeader><CardTitle>Company settings</CardTitle><CardDescription>Company name, logo, contacts, tax, location, currency, and timezone.</CardDescription></CardHeader><CardContent><form action={saveCompanySettings} encType="multipart/form-data" className="grid gap-4 md:grid-cols-2"><Field label="Company name" name="company_name" value={settings.companyName} /><Field label="Slogan" name="slogan" value={settings.slogan} /><Field label="Logo URL" name="logo_url" value={settings.logoUrl} /><FileField label="Upload logo" name="logo_file" /><Field label="Primary color" name="primary_color" value={settings.primaryColor} type="color" /><Field label="Email" name="email" value={settings.email} /><Field label="Phone" name="phone" value={settings.phone} /><Field label="Address" name="address" value={settings.address} /><Field label="TRN / Tax registration number" name="tax_registration_number" value={settings.taxRegistrationNumber} /><Field label="Website" name="website" value={settings.website} /><Field label="Country" name="country" value={settings.country} /><Field label="City" name="city" value={settings.city} /><CurrencyField value={settings.currency} /><Field label="Timezone" name="timezone" value={settings.timezone} /><Button className="md:w-fit">Save Settings</Button></form></CardContent></Card>;
}

function Invoicing({ settings }: { settings: SettingsRecord }) {
  return <Card><CardHeader><CardTitle>Invoicing settings</CardTitle></CardHeader><CardContent><form action={saveInvoiceSettings} className="grid gap-4 md:grid-cols-2"><Field label="Invoice prefix" name="invoice_prefix" value={settings.invoicePrefix} /><Field label="Next invoice number" name="next_invoice_number" value={String(settings.nextInvoiceNumber)} type="number" /><Field label="Quote prefix" name="quote_prefix" value={settings.quotePrefix} /><Field label="Payment receipt prefix" name="payment_receipt_prefix" value={settings.paymentReceiptPrefix} /><Field label="Default tax rate" name="default_tax_rate" value={String(settings.defaultTaxRate)} type="number" /><Field label="Payment terms" name="payment_terms" value={settings.paymentTerms} /><Area label="Footer notes" name="footer_notes" value={settings.footerNotes} /><Area label="Bank details" name="bank_details" value={settings.bankDetails} /><Button className="md:w-fit">Save Settings</Button></form></CardContent></Card>;
}

function MyAccount({ tenant }: { tenant: TenantContext }) {
  const [first, ...rest] = tenant.user.name.split(" ");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Account</CardTitle>
          <CardDescription>Profile image, personal information, and secure password updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveMyAccountSettings} encType="multipart/form-data" className="grid gap-4 md:grid-cols-2">
            <Field label="First name" name="first_name" value={first ?? ""} />
            <Field label="Last name" name="last_name" value={rest.join(" ")} />
            <Field label="Email" name="email" value={tenant.user.email} />
            <Field label="Phone" name="phone" value="" />
            <Field label="New password" name="password" value="" type="password" />
            <Field label="Confirm new password" name="confirm_password" value="" type="password" />
            <Field label="Profile photo URL" name="profile_photo_url" value={tenant.user.avatarUrl ?? ""} />
            <FileField label="Upload profile photo" name="profile_photo_file" />
            <p className="text-xs text-muted-foreground md:col-span-2">
              Password must include uppercase, lowercase, number, special character, and at least 8 characters. Leave both password fields empty if you only want to update profile details.
            </p>
            <Button className="md:w-fit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Session security</CardTitle>
          <CardDescription>End this device session securely before handing the workstation to another user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutCurrentUser}>
            <Button variant="outline">Log out securely</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Appearance({ settings, tenant }: { settings: SettingsRecord; tenant: TenantContext }) {
  return <Card><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Company branding preview uses {tenant.company.name}.</CardDescription></CardHeader><CardContent><form action={saveBrandingSettings} className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label>Theme mode</Label><Select name="theme_mode" defaultValue={settings.themeMode}><option value="dark">dark</option><option value="light">light</option><option value="system">system</option></Select></div><Field label="Primary color" name="primary_color" value={settings.primaryColor} type="color" /><Field label="Sidebar style" name="sidebar_style" value={settings.sidebarStyle} /><label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" name="compact_mode" defaultChecked={settings.compactMode} /> Compact mode</label><div className="rounded-md border p-4 md:col-span-2"><p className="font-semibold">{tenant.company.name}</p><p className="text-sm text-muted-foreground">Branding preview</p></div><Button className="md:w-fit">Save Settings</Button></form></CardContent></Card>;
}

function Notifications({ settings }: { settings: SettingsRecord }) {
  const items = [["email_notifications", "Email notifications", settings.emailNotifications], ["whatsapp_notifications", "WhatsApp notifications", settings.whatsappNotifications], ["shipment_notifications", "Shipment notifications", settings.shipmentNotifications], ["payment_notifications", "Payment notifications", settings.paymentNotifications], ["task_notifications", "Task notifications", settings.taskNotifications], ["approval_notifications", "Approval notifications", settings.approvalNotifications]] as const;
  return <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent><form action={saveNotificationSettings} className="grid gap-3">{items.map(([name, label, checked]) => <label key={name} className="flex items-center justify-between rounded-md border p-3 text-sm"><span>{label}</span><input type="checkbox" name={name} defaultChecked={checked} /></label>)}<Button className="w-fit">Save Settings</Button></form></CardContent></Card>;
}

function InviteUsers() {
  return <Card><CardHeader><CardTitle>Invite Users</CardTitle><CardDescription>Invite staff by email, assign role, assign permissions, and generate invite link.</CardDescription></CardHeader><CardContent><form action={inviteUser} className="grid gap-4 md:grid-cols-2"><Field label="Email" name="email" value="" /><Field label="Role ID" name="role_id" value="" /><Area label="Permissions (comma separated)" name="permissions" value="shipments.view,customers.view" /><Button className="md:w-fit">Send invite link</Button></form><div className="mt-4 rounded-md border border-dashed p-6 text-sm text-muted-foreground">Pending invitations will appear here after they are created.</div></CardContent></Card>;
}

function Language({ settings }: { settings: SettingsRecord }) {
  return <Card><CardHeader><CardTitle>Language</CardTitle></CardHeader><CardContent><form action={saveLanguageSettings} className="grid gap-4 md:grid-cols-2"><Field label="Default language" name="default_language" value={settings.defaultLanguage} /><Field label="Date format" name="date_format" value={settings.dateFormat} /><Field label="Number format" name="number_format" value={settings.numberFormat} /><Field label="Currency format" name="currency_format" value={settings.currencyFormat} /><Button className="md:w-fit">Save Settings</Button></form></CardContent></Card>;
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value: string; type?: string }) {
  const numberProps = type === "number" ? { inputMode: "decimal" as const, min: "0", step: "0.01" } : {};
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} defaultValue={value} type={type} {...numberProps} /></div>;
}

function CurrencyField({ value }: { value: string }) {
  return (
    <div className="grid gap-2">
      <Label>Currency</Label>
      <Select name="currency" defaultValue={value}>
        {supportedCurrencies.map((currency) => (
          <option key={currency.code} value={currency.code}>{currency.label}</option>
        ))}
      </Select>
    </div>
  );
}

function FileField({ label, name }: { label: string; name: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} type="file" accept="image/*" /></div>;
}

function Area({ label, name, value }: { label: string; name: string; value: string }) {
  return <div className="grid gap-2 md:col-span-2"><Label>{label}</Label><Textarea name={name} defaultValue={value} /></div>;
}
