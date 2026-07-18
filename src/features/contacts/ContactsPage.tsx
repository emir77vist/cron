import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { CsvImportPanel } from '@/features/contacts/CsvImportPanel'
import { ImportReview } from '@/features/contacts/ImportReview'
import { ContactsTable } from '@/features/contacts/ContactsTable'
import type {
  ContactImportCommitResult,
  ContactImportSession,
} from '@/types/contact-import'
import { useContacts } from '@/lib/data/contacts'

type Phase =
  | { kind: 'idle' }
  | { kind: 'review'; session: ContactImportSession }
  | { kind: 'done'; result: ContactImportCommitResult }

export function ContactsPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const contacts = useContacts()

  return (
    <div className="page-shell-wide">
      <PageHeader
        title="Contacts"
        description="Networking mini-CRM. Import people, match companies, link them to your pipeline — only after you confirm."
      />

      <div className="mt-16 space-y-16">
        {phase.kind === 'review' ? (
          <ImportReview
            session={phase.session}
            onCancel={() => setPhase({ kind: 'idle' })}
            onCommitted={(result) => setPhase({ kind: 'done', result })}
          />
        ) : (
          <>
            {phase.kind === 'done' && (
              <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-5 py-4 text-sm text-[#888888]">
                <span className="text-white">Import saved.</span>
                {' '}
                {phase.result.contactsCreated} contact
                {phase.result.contactsCreated === 1 ? '' : 's'}
                {phase.result.companiesCreated > 0 && (
                  <>
                    {' · '}
                    {phase.result.companiesCreated} new compan
                    {phase.result.companiesCreated === 1 ? 'y' : 'ies'}
                  </>
                )}
                {phase.result.applicationsLinked > 0 && (
                  <>
                    {' · '}
                    {phase.result.applicationsLinked} application link
                    {phase.result.applicationsLinked === 1 ? '' : 's'}
                  </>
                )}
                {phase.result.skipped > 0 && (
                  <>
                    {' · '}
                    {phase.result.skipped} skipped
                  </>
                )}
                <button
                  type="button"
                  className="ml-3 text-[#555555] underline-offset-2 hover:text-[#888888] hover:underline"
                  onClick={() => setPhase({ kind: 'idle' })}
                >
                  Dismiss
                </button>
              </div>
            )}

            <CsvImportPanel
              onSessionReady={(session) =>
                setPhase({ kind: 'review', session })
              }
            />

            <ContactsTable key={contacts.length} />
          </>
        )}
      </div>
    </div>
  )
}
