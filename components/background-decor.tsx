export default function BackgroundDecor() {
  return (
    <>
      {/* 柔和粉色光斑（适配白底） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-28 h-[360px] w-[360px] rounded-full blur-3xl opacity-30"
        style={{
          background: "radial-gradient(closest-side, rgba(236,72,153,0.35), rgba(244,63,94,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-25"
        style={{
          background: "radial-gradient(closest-side, rgba(244,63,94,0.28), rgba(236,72,153,0.18), transparent 70%)",
        }}
      />
      {/* 纸质噪点叠加（白底下用 multiply 更自然） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.06]"
        style={{ backgroundImage: "url('/images/noise.png')" }}
      />
    </>
  )
}
