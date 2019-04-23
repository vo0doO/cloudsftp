import { ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
export declare class CoordinatesDirective implements OnInit, OnDestroy {
    private el;
    coordinatesChange: Subject<{
        x: number;
        y: number;
        top: number;
        left: number;
        containerWidth: number;
        containerHeight: number;
        $event: any;
    }>;
    private mousechange;
    private mouseListening;
    private sub;
    mousemove($event: Event, x: number, y: number, isTouch?: boolean): void;
    mouseup(): void;
    mousedown($event: Event, x: number, y: number, isTouch?: boolean): void;
    constructor(el: ElementRef);
    ngOnInit(): void;
    ngOnDestroy(): void;
    handleChange(x: number, y: number, $event: Event, isTouch: boolean): void;
}
export declare class CoordinatesModule {
}
