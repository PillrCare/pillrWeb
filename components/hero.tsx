
export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <h1 className="sr-only">Pillr solves medical adherence protection and information</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto text-center">
        {/* Adherence | Protection | Information */}
        Never Miss Your Medication Again
      </p>
      
      
      <p className="text-xl mx-auto text-center">
        Pillr&apos;s biometric pill bottle uses advanced fingerprint technology to ensure medication adherence, providing peace of mind for patients and families while protecting against misuse.
      </p>
      <div className="flex justify-center">
        <div className="bg-accent border rounded p-2 m-2"> Secure Design</div>
        <div className="bg-accent border rounded p-2 m-2"> Smart Connected</div>
        <div className="bg-accent border rounded p-2 m-2"> Real-time Alerts</div>
        <div className="bg-accent border rounded p-2 m-2"> Privacy Focused</div>
      </div>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
