import {TemplateGenerator} from "./TemplateGenerator.jsx";


export default {
    title: 'Demo/Template',
    component: TemplateGenerator,
    tags: ['autodocs'],
    argTypes: {
        backgroundColor: { control: 'color' },
    },
};

export const Small = {
    args: {
        size: 'small',
        label: 'Button',
    },
};
