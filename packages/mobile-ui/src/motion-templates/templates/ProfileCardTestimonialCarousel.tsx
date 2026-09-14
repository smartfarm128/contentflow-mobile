import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Github, Twitter, Youtube, Linkedin } from "lucide-react";

// Helper to ease values
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function ProfileCardTestimonialCarouselTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // Read Controls
  const slideDuration = Math.max(0.5, Number(values.slideDuration ?? 4.0));

  const name1 = String(values.name1 ?? "Michael Chen");
  const title1 = String(values.title1 ?? "Senior Software Engineer, Cloud Infrastructure");
  const desc1 = String(values.desc1 ?? "Working with this team completely changed our infrastructure game. The support and expertise were incredible. They delivered beyond our expectations and helped us scale to millions of users.");
  const image1 = String(values.image1 ?? "https://plus.unsplash.com/premium_photo-1689977807477-a579eda91fa2?q=80&w=300&auto=format&fit=crop");
  const github1 = String(values.github1 ?? "#");
  const twitter1 = String(values.twitter1 ?? "#");
  const linkedin1 = String(values.linkedin1 ?? "#");
  const youtube1 = String(values.youtube1 ?? "#");

  const name2 = String(values.name2 ?? "Jessica Roberts");
  const title2 = String(values.title2 ?? "Lead Data Scientist, InsightX");
  const desc2 = String(values.desc2 ?? "The data analytics platform they built gave our team the confidence and tools needed for true data-driven decisions. Their dashboarding capabilities went above and beyond our expectations.");
  const image2 = String(values.image2 ?? "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=300&q=80");
  const github2 = String(values.github2 ?? "#");
  const twitter2 = String(values.twitter2 ?? "#");
  const linkedin2 = String(values.linkedin2 ?? "#");
  const youtube2 = String(values.youtube2 ?? "#");

  const name3 = String(values.name3 ?? "William Carter");
  const title3 = String(values.title3 ?? "VP Product, NovaLabs");
  const desc3 = String(values.desc3 ?? "NovaLabs helped our products find the perfect market fit. Their engineering team exceeded every delivery milestone and provided exceptional technical leadership.");
  const image3 = String(values.image3 ?? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80");
  const github3 = String(values.github3 ?? "#");
  const twitter3 = String(values.twitter3 ?? "#");
  const linkedin3 = String(values.linkedin3 ?? "#");
  const youtube3 = String(values.youtube3 ?? "#");

  const testimonials = useMemo(() => {
    return [
      { name: name1, title: title1, description: desc1, imageUrl: image1, githubUrl: github1, twitterUrl: twitter1, linkedinUrl: linkedin1, youtubeUrl: youtube1 },
      { name: name2, title: title2, description: desc2, imageUrl: image2, githubUrl: github2, twitterUrl: twitter2, linkedinUrl: linkedin2, youtubeUrl: youtube2 },
      { name: name3, title: title3, description: desc3, imageUrl: image3, githubUrl: github3, twitterUrl: twitter3, linkedinUrl: linkedin3, youtubeUrl: youtube3 },
    ].filter(t => t.name && t.description);
  }, [
    name1, title1, desc1, image1, github1, twitter1, linkedin1, youtube1,
    name2, title2, desc2, image2, github2, twitter2, linkedin2, youtube2,
    name3, title3, desc3, image3, github3, twitter3, linkedin3, youtube3,
  ]);

  const count = testimonials.length;
  if (count === 0) return null;

  // Compute active slide from time
  const totalCycle = count * slideDuration;
  const activeTime = time % totalCycle;
  const currentSlideIndex = Math.floor(activeTime / slideDuration);
  const relativeTime = activeTime % slideDuration;

  const previousSlideIndex = (currentSlideIndex - 1 + count) % count;

  const transitionDuration = 0.5;
  const isTransitioning = relativeTime < transitionDuration;
  const transitionProgress = isTransitioning ? relativeTime / transitionDuration : 1.0;
  const eased = easeOutCubic(transitionProgress);

  // Scaling Factor
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#08090d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scaleFactor * 1.5})`,
          transformOrigin: "center center",
          width: "100%",
          maxWidth: "960px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
          padding: "24px",
        }}
      >
        {/* Carousel Content Frame */}
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "480px",
          }}
        >
          {/* Left: Avatar Stack */}
          <div
            style={{
              position: "relative",
              width: "420px",
              height: "420px",
              borderRadius: "24px",
              overflow: "hidden",
              backgroundColor: "#11131c",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              flexShrink: 0,
              zIndex: 2,
            }}
          >
            {testimonials.map((t, index) => {
              const isActive = index === currentSlideIndex;
              const isPrevious = index === previousSlideIndex;

              let opacity = 0;
              let scale = 0.95;

              if (isActive) {
                opacity = eased;
                scale = 0.95 + eased * 0.05;
              } else if (isPrevious) {
                opacity = 1 - eased;
                scale = 1.0;
              }

              if (!isActive && !isPrevious) return null;

              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity,
                    transform: `scale(${scale})`,
                    willChange: "transform, opacity",
                  }}
                >
                  <img
                    src={t.imageUrl}
                    alt={t.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Right: Testimonial Card */}
          <div
            style={{
              position: "relative",
              backgroundColor: "#0f111a",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "48px 48px 48px 96px",
              marginLeft: "-60px",
              height: "360px",
              flex: 1,
              zIndex: 1,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            {testimonials.map((t, index) => {
              const isActive = index === currentSlideIndex;
              const isPrevious = index === previousSlideIndex;

              let opacity = 0;
              let xOffset = 20;

              if (isActive) {
                opacity = eased;
                xOffset = (1 - eased) * 20;
              } else if (isPrevious) {
                opacity = 1 - eased;
                xOffset = -eased * 20;
              }

              if (!isActive && !isPrevious) return null;

              const socialIcons = [
                { icon: Github, url: t.githubUrl, label: "GitHub" },
                { icon: Twitter, url: t.twitterUrl, label: "Twitter" },
                { icon: Youtube, url: t.youtubeUrl, label: "YouTube" },
                { icon: Linkedin, url: t.linkedinUrl, label: "LinkedIn" },
              ].filter(s => s.url && s.url !== "#");

              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: "40px",
                    bottom: "40px",
                    left: "96px",
                    right: "48px",
                    opacity,
                    transform: `translate3d(${xOffset}px, 0, 0)`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    willChange: "transform, opacity",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        color: "#ffffff",
                        letterSpacing: "-0.02em",
                        margin: 0,
                      }}
                    >
                      {t.name}
                    </h2>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#38bdf8",
                        marginTop: "4px",
                        marginBottom: "20px",
                      }}
                    >
                      {t.title}
                    </p>
                    <p
                      style={{
                        fontSize: "16px",
                        lineHeight: 1.6,
                        color: "rgba(255, 255, 255, 0.7)",
                        margin: 0,
                      }}
                    >
                      {t.description}
                    </p>
                  </div>

                  {socialIcons.length > 0 && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                      {socialIcons.map(({ icon: Icon, url, label }) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            transition: "background-color 0.2s, transform 0.2s",
                          }}
                        >
                          <Icon size={16} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Indicators / Dots */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          {testimonials.map((_, index) => {
            const isActive = index === currentSlideIndex;
            return (
              <div
                key={index}
                style={{
                  width: isActive ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.2)",
                  transition: "width 0.3s ease, background-color 0.3s ease",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProfileCardTestimonialCarouselTemplate;
