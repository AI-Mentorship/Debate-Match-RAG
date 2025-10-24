function Home({ onGetStarted }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      {/* Name */}
      <div className="mb-10">
        <h1 className="text-6xl md:text-6xl font-bold text-white mb-10 leading-tight">
          D&nbsp;&nbsp;E&nbsp;&nbsp;B&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;E&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;C&nbsp;&nbsp;H
        </h1>
        <h2 className="text-3xl md:text-3xl font-bold bg-gradient-to-r from-electric-purple via-lavender to-soft-lavender bg-clip-text text-transparent mb-5 leading-tight">
          Retrieval-Augmented Generation
        </h2>
      </div>

      {/* Description */}
      <div className="mb-40">
        <p className="mb-15 text-md md:text-md text-dark-silver max-w-5xl leading-relaxed">
          An AI-powered debate matcher that allows users to ask political questions and receive factually grounded answers based on political debate transcripts
        </p>

        {/* Button */}
        <button
          onClick={onGetStarted}
          className="bg-transparent text-gray-200 px-20 py-3 rounded-full font-bold transition-all duration-700 shadow-2xl hover:shadow-silver-glow relative overflow-hidden group border-2 border-gray-300 hover:border-white"
        >
          {/* Silver neon glow effect */}
          <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/30 blur-xl transition-all duration-1000"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          {/* Pulse ring effect */}
          <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/70 transition-all duration-1000"></div>
          
          {/* Text */}
          <span className="relative z-10 text-gray-200 group-hover:text-white transition-colors duration-300 font-bold">
            Get Started
          </span>
        </button>
      </div>
    </div>
  )
}

export default Home