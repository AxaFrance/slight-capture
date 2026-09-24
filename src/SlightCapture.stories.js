import {SlightCaptureVideo} from "./SlightCapture.jsx";
import {expect, within} from "@storybook/test";

export default {
    title: 'Component/SlightCapture',
    component: SlightCaptureVideo,
    tags: ['autodocs'],
    argTypes: { },
};

const baseStory = {
    title: 'Component/SlightCapture',
    component: SlightCaptureVideo,
    tags: ['autodocs'],
    argTypes: { },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', {name: 'Slight Capture'})).toBeInTheDocument();
        await expect(canvas.getByRole('button', {name: 'French ID card recto'})).toBeInTheDocument();
    },
};

export const Video = {
    ...baseStory,
};

export const Mobile = {
    ...baseStory,
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};
