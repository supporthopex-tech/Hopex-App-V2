"use client";

import { MailOpen, MailX, Trash2 } from "lucide-react";
import { deleteEmail, updateEmailState } from "@/app/(app)/email/actions";
import { Button } from "@/components/ui/button";

export function EmailActions({ emailId, isRead }: { emailId: string; isRead: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={updateEmailState}><input type="hidden" name="email_id" value={emailId} /><input type="hidden" name="action" value={isRead ? "unread" : "read"} /><Button variant="outline" size="sm"><MailOpen className="h-4 w-4" />{isRead ? "Mark unread" : "Mark read"}</Button></form>
      <form action={updateEmailState}><input type="hidden" name="email_id" value={emailId} /><input type="hidden" name="action" value="trash" /><Button variant="outline" size="sm"><MailX className="h-4 w-4" />Move to trash</Button></form>
      <form action={deleteEmail} onSubmit={(event) => { if (!confirm("Delete this email permanently?")) event.preventDefault(); }}><input type="hidden" name="email_id" value={emailId} /><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" />Delete</Button></form>
    </div>
  );
}
