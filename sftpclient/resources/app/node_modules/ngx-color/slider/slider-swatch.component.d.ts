import { EventEmitter, OnChanges } from '@angular/core';
import { HSL } from 'ngx-color';
export declare class SliderSwatchComponent implements OnChanges {
    hsl: HSL;
    active: boolean;
    offset: number;
    first: boolean;
    last: boolean;
    onClick: EventEmitter<any>;
    background: string;
    ngOnChanges(): void;
    handleClick($event: any): void;
}
