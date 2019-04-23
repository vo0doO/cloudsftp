import { EventEmitter, OnChanges } from '@angular/core';
import { HSLA, RGBA } from './helpers/color.interfaces';
export declare class AlphaComponent implements OnChanges {
    hsl: HSLA;
    rgb: RGBA;
    pointer: {
        [key: string]: string;
    };
    shadow: string;
    radius: string;
    direction: 'horizontal' | 'vertical';
    onChange: EventEmitter<any>;
    gradient: {
        [key: string]: string;
    };
    pointerLeft: number;
    pointerTop: number;
    ngOnChanges(): void;
    handleChange({ top, left, containerHeight, containerWidth, $event }: {
        top: any;
        left: any;
        containerHeight: any;
        containerWidth: any;
        $event: any;
    }): any;
}
export declare class AlphaModule {
}
