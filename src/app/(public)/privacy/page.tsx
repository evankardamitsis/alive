import type { Metadata } from "next"
import Link from "next/link"
import { StaticPage } from "@/components/layout/StaticPage"
import { pageMetadata, SITE_NAME } from "@/lib/metadata"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Πολιτική απορρήτου και προστασίας προσωπικών δεδομένων του Alive Magazine.",
  path: "/privacy",
  og: { title: "Privacy Policy — Alive Magazine", color: "#e63946" },
})

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
        Τελευταία ενημέρωση: {new Date().getFullYear()}
      </p>

      <p>
        Το {SITE_NAME} («εμείς», «μας») σέβεται την ιδιωτικότητά σου. Η παρούσα πολιτική
        εξηγεί ποια δεδομένα συλλέγουμε, πώς τα χρησιμοποιούμε και ποια δικαιώματα έχεις
        σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR).
      </p>

      <StaticPage.Section title="1. Υπεύθυνος επεξεργασίας">
        <p>
          {SITE_NAME}
          <br />
          Email:{" "}
          <a href="mailto:hello@alivemag.gr" className="underline underline-offset-4 hover:opacity-60">
            hello@alivemag.gr
          </a>
        </p>
      </StaticPage.Section>

      <StaticPage.Section title="2. Ποια δεδομένα συλλέγουμε">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Επισκέπτες:</strong> τεχνικά δεδομένα (IP, browser, σελίδες που επισκέπτεσαι)
            μέσω cookies και εργαλείων ανάλυσης, σε ψευδωνυμοποιημένη μορφή όπου είναι δυνατόν.
          </li>
          <li>
            <strong>Newsletter / φόρμες επικοινωνίας:</strong> email και ό,τι συμπληρώνεις εθελοντικά.
          </li>
          <li>
            <strong>Συντάκτες &amp; διαχειριστές:</strong> στοιχεία λογαριασμού (όνομα, email) για πρόσβαση
            στο admin panel.
          </li>
        </ul>
      </StaticPage.Section>

      <StaticPage.Section title="3. Γιατί τα χρησιμοποιούμε">
        <ul className="list-disc pl-5 space-y-2">
          <li>Λειτουργία και ασφάλεια του ιστότοπου</li>
          <li>Δημοσίευση και διαχείριση περιεχομένου</li>
          <li>Ανάλυση επισκεψιμότητας (aggregate στατιστικά)</li>
          <li>Απάντηση σε αιτήματα επικοινωνίας</li>
        </ul>
      </StaticPage.Section>

      <StaticPage.Section title="4. Cookies">
        <p>
          Χρησιμοποιούμε απαραίτητα cookies για τη λειτουργία του site (π.χ. προτιμήσεις θέματος)
          και, όπου ενεργοποιημένα, analytics cookies για ανώνυμη στατιστική επισκεψιμότητα.
          Μπορείς να τα απενεργοποιήσεις από τις ρυθμίσεις του browser σου, με πιθανή επίδραση
          στη λειτουργικότητα ορισμένων λειτουριών.
        </p>
      </StaticPage.Section>

      <StaticPage.Section title="5. Τρίτοι πάροχοι">
        <p>Ενδέχεται να επεξεργάζονται δεδομένα εκ μέρους μας:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Supabase (hosting βάσης δεδομένων &amp; αυθεντικοποίηση)</li>
          <li>Vercel (hosting εφαρμογής)</li>
          <li>Plausible ή άλλα εργαλεία analytics (αν ενεργά)</li>
        </ul>
        <p className="mt-2">
          Οι πάροχοι αυτοί δεσμεύονται από συμβάσεις επεξεργασίας και επεξεργάζονται δεδομένα
          μόνο σύμφωνα με τις οδηγίες μας.
        </p>
      </StaticPage.Section>

      <StaticPage.Section title="6. Διάρκεια διατήρησης">
        <p>
          Διατηρούμε δεδομένα μόνο για όσο χρειάζεται για τους σκοπούς που περιγράφονται παραπάνω,
          εκτός αν απαιτείται μεγαλύτερη περίοδος από το νόμο.
        </p>
      </StaticPage.Section>

      <StaticPage.Section title="7. Τα δικαιώματά σου">
        <p>Έχεις δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης.</p>
        <p className="mt-2">
          Για να ασκήσεις τα δικαιώματά σου, στείλε email στο{" "}
          <a href="mailto:hello@alivemag.gr" className="underline underline-offset-4 hover:opacity-60">
            hello@alivemag.gr
          </a>
          . Έχεις επίσης δικαίωμα καταγγελίας στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα
          (www.dpa.gr).
        </p>
      </StaticPage.Section>

      <StaticPage.Section title="8. Αλλαγές">
        <p>
          Ενδέχεται να ενημερώνουμε την πολιτική αυτή. Οι αλλαγές δημοσιεύονται σε αυτή τη σελίδα
          με νέα ημερομηνία ενημέρωσης.
        </p>
      </StaticPage.Section>

      <p className="text-sm pt-2" style={{ color: "var(--fg-3)" }}>
        Ερωτήσεις;{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:opacity-60">
          Επικοινώνησε μαζί μας
        </Link>
        .
      </p>
    </StaticPage>
  )
}
