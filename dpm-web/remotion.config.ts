import { Config } from '@remotion/cli/config';

/**
 * Remotion Configuration for NavEaze Landing Page
 * Configures video rendering settings for programmatic video compositions
 */

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264-mkv');
Config.setOverwriteOutput(true);

// Enable Tailwind CSS support in Remotion
Config.overrideWebpackConfig((currentConfiguration) => {
    return {
        ...currentConfiguration,
        module: {
            ...currentConfiguration.module,
            rules: [
                ...(currentConfiguration.module?.rules || []),
            ],
        },
    };
});
