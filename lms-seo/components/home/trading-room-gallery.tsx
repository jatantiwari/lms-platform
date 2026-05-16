import Image from 'next/image';

export function TradingRoomGallery() {
  return (
    <section className="w-full py-16 md:py-24 bg-muted/30 border-y border-border">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Inside Our Trading Room
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            See how our mentors and learners work together in a real, live market environment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { src: '/about-gallery-1.jpg', alt: 'Live trading screen with market data' },
                        { src: '/about-gallery-2.jpg', alt: 'Lead mentor and instructor' },
                        { src: '/about-gallery-5.jpg', alt: 'Multi-screen trading setup' },
                      ].map((img, i) => (
                        <div key={i} className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
                          <Image
                            src={img.src}
                            alt={img.alt}
                            width={800}
                            height={600}
                            className="w-full h-auto object-contain hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
      </div>
    </section>
  );
}
