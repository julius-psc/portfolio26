import profilePic from '../assets/images/profile-pic.png'

export default function Intro() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-4 w-full max-w-[520px]">

        <div className="flex items-center gap-3">
          <img
            src={profilePic}
            alt="Julius Peschard"
            className="w-14 h-14 rounded-full object-cover shrink-0"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-primary tracking-[-0.01em]">Julius Peschard</span>
            <span className="text-sm font-medium text-primary opacity-40 tracking-[-0.01em]">Design Engineer</span>
          </div>
        </div>

        <p className="text-sm font-medium text-primary tracking-[-0.01em]">
          I design and build products from end to end, from systems thinking and interface
          decisions to the shipped code. I care as much about <em>why</em> an interaction is
          structured the way it is as how it looks.
        </p>

      </div>
    </div>
  )
}
