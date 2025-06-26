<img width="444" alt="image" src="https://github.com/user-attachments/assets/136003df-82b8-446f-9679-ae03ad885929" />


# Busy Dad Training - Burpee Workout App

https://youtu.be/tvnW185Vd8A

An unofficial web app inspired by the [Busy Dad Training](https://busydadtraining.com/) YouTube burpee workouts. This app helps you follow along with burpee workouts using real audio clips from the training videos.

**Disclaimer**: This is a hobby project and I am not affiliated with the official Busy Dad Training program.

## Features

- ⏱️ **Timed Workouts**: Set duration and target reps
- 🎤 **Real Audio Counts**: Uses actual trainer voice clips for counts 1-5
- 📢 **Voice Callouts**: Hear rep numbers and count callouts
- 📊 **Progress Tracking**: Visual progress bars for reps and time
- ⏸️ **Pause/Resume**: Control your workout as needed
- 📱 **Mobile Optimized**: Works great as a PWA on phones
- 🌙 **Dark Theme**: Easy on the eyes during workouts

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with glass-morphism design
- **Audio**: Web Audio API with real voice clips
- **Runtime**: Bun (also works with Node.js)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/elliott-chong/busy-dad-training.git
cd busy-dad-training
```

2. Install dependencies:
```bash
bun install
# or npm install
```

3. Run the development server:
```bash
bun run dev
# or npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
bun run build
bun run start
# or npm run build && npm run start
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── BurpeeWorkout.tsx   # Main workout component
│   ├── WorkoutDisplay.tsx  # Workout UI during exercise
│   └── WorkoutConfiguration.tsx # Settings UI
├── hooks/                  # Custom React hooks
│   ├── useBurpeeWorkout.ts # Workout logic
│   └── useCountAudio.ts    # Audio playback
└── lib/                    # Utility functions
public/
└── audio/
    └── counts/             # Voice count audio files (1-5)
```

## Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📝 Improve documentation
- ⭐ Star the repository

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run checks:
   ```bash
   bun run typecheck
   biome check
   ```
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Ideas for Contributions

- 🎨 Additional workout modes (EMOM, Tabata, etc.)
- 📈 Workout history and statistics
- 🌍 Internationalization support
- 🎵 Custom sound packs
- 🤖 AI-powered form tips
- 📲 Native mobile apps
- 🏆 Achievements and gamification

## Deployment

The app can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/elliott-chong/busy-dad-training)
- **Netlify**: Works with the Next.js adapter
- **Self-hosted**: Use `bun run build` and serve with `bun run start`

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Thanks to [Busy Dad Training](https://busydadtraining.com/) for the workout inspiration
- Audio clips extracted from publicly available YouTube videos for educational purposes

---

**Note**: Always consult with a healthcare provider before starting any new exercise program.
