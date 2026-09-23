/**
 * Dynamic greeting generator tailored to time of day and user's name
 * with catchy English synonyms and phrases changing on every new chat
 */

export function getRandomGreeting(name: string): string {
  const cleanName = (name || 'Friend').trim();
  const hour = new Date().getHours();

  // Time-specific pool
  const timeBasedPool: string[] = [];

  if (hour >= 5 && hour < 12) {
    timeBasedPool.push(
      `Good morning, ${cleanName}`,
      `Rise and shine, ${cleanName}`,
      `Bright morning, ${cleanName}`,
      `Morning inspiration, ${cleanName}`,
      `A fresh start today, ${cleanName}`
    );
  } else if (hour >= 12 && hour < 17) {
    timeBasedPool.push(
      `Good afternoon, ${cleanName}`,
      `Midday thoughts, ${cleanName}?`,
      `Pleasant afternoon, ${cleanName}`,
      `Afternoon momentum, ${cleanName}`,
      `Afternoon creativity, ${cleanName}`
    );
  } else if (hour >= 17 && hour < 22) {
    timeBasedPool.push(
      `Good evening, ${cleanName}`,
      `Evening thoughts, ${cleanName}?`,
      `Sunset inspiration, ${cleanName}`,
      `Evening momentum, ${cleanName}`,
      `Winding down, ${cleanName}?`
    );
  } else {
    // Night (22 to 4)
    timeBasedPool.push(
      `Late-night thinking, ${cleanName}?`,
      `Midnight musings, ${cleanName}?`,
      `Night owl mode, ${cleanName}`,
      `Quiet night reflections, ${cleanName}`,
      `Moonlit thoughts, ${cleanName}?`
    );
  }

  // Catchy synonyms & engaging English greetings
  const versatilePool: string[] = [
    `Hello, ${cleanName}`,
    `Hey there, ${cleanName}!`,
    `Welcome back, ${cleanName}`,
    `Greetings, ${cleanName}`,
    `Salutations, ${cleanName}`,
    `What's on your mind, ${cleanName}?`,
    `Ready to create, ${cleanName}?`,
    `Let's build something brilliant, ${cleanName}`,
    `At your service, ${cleanName}`,
    `How can I help you today, ${cleanName}?`,
    `Great to see you, ${cleanName}!`,
    `Curiosity sparked, ${cleanName}?`
  ];

  // Combine both pools (50% time-specific, 50% versatile)
  const combined = [...timeBasedPool, ...versatilePool];
  const selectedIndex = Math.floor(Math.random() * combined.length);
  return combined[selectedIndex];
}
