/** Explicit consent. The wording mirrors what the backend actually does (temporary storage, then automatic deletion). */
export default function ConsentCheckbox({ checked, onChange, retentionMinutes = 30 }) {
  return (
    <div className="rounded-xl border border-[#E3BF72]/60 bg-white p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-5 w-5 flex-shrink-0 accent-[#0f3d2e]"
        />
        <span className="text-sm leading-relaxed text-[#10241d]">
          I agree that my photo may be processed by Mayil Boutique's AI Virtual Try-On service to create a preview of the
          selected outfit.
        </span>
      </label>
      <ul className="mt-3 space-y-1 pl-8 text-xs leading-relaxed text-brand-secondary">
        <li>Your photo and the preview are kept only temporarily (about {retentionMinutes} minutes after the preview is ready) and then deleted automatically.</li>
        <li>You can delete them yourself at any time.</li>
        <li>They are not used for advertising or to train AI models.</li>
        <li>The photo is sent to our own AI processing service to generate the preview.</li>
      </ul>
    </div>
  );
}
