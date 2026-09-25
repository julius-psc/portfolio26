import { EncryptedText } from '@/components/ui/encrypted-text'

/** A component's name written as its JSX tag — `<Name />` — with the angle
 * brackets faded so the name reads first. Size, weight and colour come from
 * the parent. */
export default function ComponentName({ name, scramble = false }: { name: string; scramble?: boolean }) {
  return (
    <span className="inline-flex">
      <span aria-hidden className="opacity-40">&lt;</span>
      {scramble ? (
        <EncryptedText
          text={name}
          encryptedClassName="text-primary"
          revealedClassName="text-primary"
          revealDelayMs={40}
          flipDelayMs={40}
        />
      ) : (
        name
      )}
      <span aria-hidden className="whitespace-pre opacity-40"> /&gt;</span>
    </span>
  )
}
