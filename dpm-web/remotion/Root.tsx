import { Composition } from 'remotion';
import type { HeroVideoProps } from './compositions/HeroVideo';
import type { HeatmapProps } from './compositions/HeatmapAnimation';
import type { PaperKillerProps } from './compositions/PaperKillerCounter';
import { HeroVideo } from './compositions/HeroVideo';
import { HeatmapAnimation } from './compositions/HeatmapAnimation';
import { PaperKillerCounter } from './compositions/PaperKillerCounter';

/**
 * Root Remotion Composition Registry
 * Registers all video compositions for the NavEaze landing page
 */

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="HeroVideo"
                component={HeroVideo}
                durationInFrames={240}
                fps={60}
                width={1920}
                height={1080}
                defaultProps={{
                    mode: 'companion' as const,
                    accentColor: '#FF4D32',
                    tagline: 'Find your way. Keep your tribe.',
                } satisfies HeroVideoProps}
            />

            <Composition
                id="HeatmapAnimation"
                component={HeatmapAnimation}
                durationInFrames={360}
                fps={60}
                width={1920}
                height={1080}
                defaultProps={{
                    mode: 'companion' as const,
                    showMetrics: true,
                } satisfies HeatmapProps}
            />

            <Composition
                id="PaperKillerCounter"
                component={PaperKillerCounter}
                durationInFrames={300}
                fps={60}
                width={1920}
                height={1080}
                defaultProps={{
                    signsReplaced: 12847,
                    co2Saved: 4.2,
                    treesSaved: 89,
                } satisfies PaperKillerProps}
            />
        </>
    );
};
