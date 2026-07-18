import { ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  deleteContact,
  getContactCompanyName,
  useContacts,
} from '@/lib/data/contacts'
import { useAppStore } from '@/stores/app-store'
import type { Contact } from '@/types'

export function ContactsTable() {
  const contacts = useContacts()
  const companies = useAppStore((s) => s.companies)
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)

  // re-read company names when companies change
  void companies

  if (contacts.length === 0) {
    return (
      <section aria-label="Contacts list">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium tracking-tight text-white">
            Contacts
          </h2>
        </div>
        <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#141414]/50 px-8 py-16 text-center">
          <p className="text-sm font-medium text-white">No contacts yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#555555]">
            Import a CSV to build your network graph. Company names fuzzy-match
            to roles already in Job Hub.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Contacts list">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium tracking-tight text-white">
          Contacts
        </h2>
        <span className="text-xs text-[#555555]">
          {contacts.length} people
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Name
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Company
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Title
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Linked apps
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Source
              </TableHead>
              <TableHead className="h-11 w-12 px-2">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                companyName={getContactCompanyName(contact)}
                onOpenJobs={() => setActiveRoute('jobs')}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function ContactRow({
  contact,
  companyName,
  onOpenJobs,
}: {
  contact: Contact
  companyName: string
  onOpenJobs: () => void
}) {
  return (
    <TableRow className="border-[#2A2A2A] hover:bg-[#1A1A1A]/60">
      <TableCell className="px-4 py-3.5">
        <div>
          <p className="font-medium text-white">{contact.name}</p>
          {contact.email && (
            <p className="mt-0.5 text-xs text-[#555555]">{contact.email}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-sm text-[#888888]">
        {companyName}
        {!contact.companyId && contact.companyNameRaw && (
          <span className="ml-2 text-[10px] uppercase tracking-wider text-[#555555]">
            unlinked
          </span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-sm text-[#888888]">
        {contact.title || '—'}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        {contact.applicationIds.length > 0 ? (
          <button
            type="button"
            onClick={onOpenJobs}
            className="text-sm tabular-nums text-white underline-offset-2 hover:underline"
          >
            {contact.applicationIds.length}
          </button>
        ) : (
          <span className="text-sm text-[#555555]">—</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-xs uppercase tracking-wider text-[#555555]">
        {contact.source}
      </TableCell>
      <TableCell className="px-2 py-3.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[#555555] hover:bg-[#1A1A1A] hover:text-white"
              aria-label="Contact actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-[#2A2A2A] bg-[#141414] text-white"
          >
            {contact.linkedin && (
              <DropdownMenuItem
                className="gap-2 focus:bg-[#1A1A1A] focus:text-white"
                onClick={() =>
                  window.open(contact.linkedin, '_blank', 'noopener')
                }
              >
                <ExternalLink className="size-3.5 text-[#888888]" />
                Open LinkedIn
              </DropdownMenuItem>
            )}
            {contact.applicationIds.length > 0 && (
              <DropdownMenuItem
                className="gap-2 focus:bg-[#1A1A1A] focus:text-white"
                onClick={onOpenJobs}
              >
                View Job Hub
              </DropdownMenuItem>
            )}
            {(contact.linkedin || contact.applicationIds.length > 0) && (
              <DropdownMenuSeparator className="bg-[#2A2A2A]" />
            )}
            <DropdownMenuItem
              className="gap-2 text-[#888888] focus:bg-[#1A1A1A] focus:text-white"
              onClick={() => deleteContact(contact.id)}
            >
              <Trash2 className="size-3.5" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
