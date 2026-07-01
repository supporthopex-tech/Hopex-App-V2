"use client";

import Link from "next/link";
import { Edit, Eye, KeyRound, Mail, Send, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteStaff, inviteStaff, resetStaffPassword, updateStaffStatus } from "@/app/(app)/staff/actions";
import type { StaffRecord } from "@/lib/staff/types";

export function StaffActions({ staff }: { staff: StaffRecord }) {
  const suspendStatus = staff.status === "suspended" ? "active" : "suspended";
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild variant="ghost" size="sm"><Link href={`/staff/${staff.id}`}><Eye className="h-4 w-4" />View</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/staff/${staff.id}?mode=edit`}><Edit className="h-4 w-4" />Edit</Link></Button>
      <Button asChild variant="ghost" size="sm"><a href={`mailto:${staff.email}`}><Mail className="h-4 w-4" />Email</a></Button>
      <form action={inviteStaff}>
        <input type="hidden" name="staff_id" value={staff.id} />
        <Button type="submit" variant="ghost" size="sm"><Send className="h-4 w-4" />Invite</Button>
      </form>
      <form action={resetStaffPassword}>
        <input type="hidden" name="staff_id" value={staff.id} />
        <Button type="submit" variant="ghost" size="sm"><KeyRound className="h-4 w-4" />Reset</Button>
      </form>
      <form action={updateStaffStatus}>
        <input type="hidden" name="staff_id" value={staff.id} />
        <input type="hidden" name="status" value={suspendStatus} />
        <Button type="submit" variant="ghost" size="sm">
          {staff.status === "suspended" ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
          {staff.status === "suspended" ? "Activate" : "Suspend"}
        </Button>
      </form>
      <form
        action={deleteStaff}
        onSubmit={(event) => {
          if (!confirm("Delete this staff member?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="staff_id" value={staff.id} />
        <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </form>
    </div>
  );
}
