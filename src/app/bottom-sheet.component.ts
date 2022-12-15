import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { merge, fromEvent, Subject, exhaustMap } from 'rxjs';
import { ElementRef } from '@angular/core';
import { takeUntil, tap } from 'rxjs';

@Component({
  selector: 'draggable-bottom-sheet',
  template: `
    <div [ngClass]="sheetClass()" [style.transform]="sheetTransform">
      <div [ngClass]="contentsClass()">
        <header>
          <div #draggableArea class="draggableArea">
            <div class="draggableThumb"></div>
          </div>
          <button class="closingButton" type="button" (click)="onCloseEvent()">×</button>
        </header>
        <main class="main" [style.max-height]="mainHeight">
          <h2>License</h2>
          MIT License Copyright (c) 2022 toshelp Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
          documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
          merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject
          to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
          Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
          OTHER DEALINGS IN THE SOFTWARE. MIT License Copyright (c) 2022 toshelp Permission is hereby granted, free of charge, to any person obtaining a copy of
          this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
          rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or
          substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
          FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. MIT License Copyright (c) 2022 toshelp Permission is hereby granted, free of charge, to any
          person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
          to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
          COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
          CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. MIT License Copyright (c) 2022 toshelp Permission is hereby granted, free
          of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without
          restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
          and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission
          notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
          SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
          ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. MIT License Copyright (c) 2022 toshelp
          Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to
          deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
          sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above
          copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
          WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
          NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
          CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .sheet {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        word-break: break-word;
        min-height: 100vh;
        max-height: 100vh;
        width: 100vw;
        align-items: center;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }

      .onSheetDragging {
        /*
        transition: transform 40ms linear;
        will-change: transform;
        */
      }

      .notSheetDragging {
        transition: transform 400ms ease;
        will-change: transform;
      }

      .inactive {
        opacity: 0;
        visibility: hidden;
        transition: 350ms;
        will-change: transform opacity;
      }

      .contents {
        background: #fff;
        position: relative;
        width: 100vw;
        max-width: 40rem;
        min-width: 16rem;
        min-height: 100%;
        padding: 1rem;
        padding-top: 42px;
        box-sizing: border-box;
        pointer-events: auto;
        transition: 300ms;
        will-change: transform;
      }

      .notFullScreen {
        border-radius: 1.2rem 1.2rem 0 0;
        will-change: border-radius;
      }

      .onContentsDragging {
        backdrop-filter: blur(3px);
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0px 0px 12px #777;
        border-radius: 1.2rem 1.2rem 0 0;
        will-change: border-radius backdrop-filter;
      }

      .notContentsDragging {
        background: rgba(255, 255, 255, 1);
      }

      .draggableArea {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: 50%;
        margin: auto;
        padding: 1rem;
        cursor: grab;
        text-align: center;
        text-align: -moz-center;
        text-align: -webkit-center;
      }

      .draggableThumb {
        width: 4rem;
        height: 0.25rem;
        background: #ddd;
        border-radius: 0.125rem;
      }

      .closingButton {
        position: absolute;
        top: 9px;
        right: 10px;
        padding: 0.2rem;
        font-size: 1rem;
        border-radius: 1rem;
        background: rgba(0, 0, 0, 0);
        cursor: pointer;
        border-width: 0;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      }

      .closingButton:focus {
        outline: none;
      }

      .main {
        overflow: auto;
        padding: 0.8rem;
        scrollbar-gutter: stable;
        transition: max-height 300ms;
        will-change: max-height;
      }

      .main::-webkit-scrollbar {
        width: 6px;
      }

      .main::-webkit-scrollbar-thumb {
        background: #aaa;
        border-radius: 4px;
      }

      .main::-webkit-scrollbar-track {
        background: #ddd;
        border-radius: 4px;
      }
    `,
  ],
})
export class BottomSheetComponent implements OnInit, OnDestroy {
  @ViewChild('draggableArea', { static: true }) draggableArea!: ElementRef;
  private readonly bottomPaddingPx = 90;
  private destroy$ = new Subject<void>();
  public isActive: boolean = false;
  public isDragging: boolean = false;
  private isFullScreen: boolean = false;
  private dragPositionYpx: number = 0;
  private currentPositionY: number = 0;
  private deltaYpx: number = 0;
  public sheetTransform = `translate3d(0, 100%, 0)`;
  public mainHeight = `100vh`;

  constructor() {}

  public sheetClass() {
    return {
      sheet: true,
      inactive: !this.isActive,
      onSheetDragging: this.isDragging,
      notSheetDragging: !this.isDragging,
    };
  }

  public contentsClass() {
    return {
      contents: true,
      onContentsDragging: this.isDragging,
      notContentsDragging: !this.isDragging,
      notFullScreen: !this.isFullScreen,
    };
  }

  public ngOnInit(): void {
    const mousedown$ = fromEvent(this.draggableArea.nativeElement, 'mousedown');
    const mousemove$ = fromEvent(window, 'mousemove');
    const mouseup$ = fromEvent(window, 'mouseup');
    const touchstart$ = fromEvent(this.draggableArea.nativeElement, 'touchstart');
    const touchmove$ = fromEvent(window, 'touchmove');
    const touchend$ = fromEvent(window, 'touchend');
    const start$ = merge(touchstart$, mousedown$);
    const move$ = merge(touchmove$, mousemove$);
    const end$ = merge(touchend$, mouseup$);

    start$
      .pipe(
        tap((event) => {
          this.currentPositionY = window.innerHeight * (this.currentPositionY / 100); // convert from % to px.
          this.isDragging = true;
          this.dragPositionYpx = (event as TouchEvent).touches
            ? (event as TouchEvent).touches[0].pageY
            : (event as MouseEvent)
            ? (event as MouseEvent).pageY
            : 0;
        }),
        exhaustMap(() =>
          move$.pipe(
            tap((event) => {
              if ((event as TouchEvent).touches) {
                this.deltaYpx = this.dragPositionYpx - (event as TouchEvent).touches[0].pageY;
              } else {
                this.deltaYpx = this.dragPositionYpx - (event as MouseEvent).pageY;
              }
              this.sheetTransform = `translate3d(0, max(${0}px, ${this.currentPositionY - this.deltaYpx}px), 1px)`;
            }),
            takeUntil(end$)
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();

    end$.subscribe(() => {
      if (this.isDragging) {
        this.isDragging = false;
        this.currentPositionY = Math.max(this.currentPositionY - this.deltaYpx, 0);
        let positionY = ((window.innerHeight - this.currentPositionY) / window.innerHeight) * 100;
        this.setSheetHeight(positionY);
      }
    });
    this.isActive = false;

    // DELETEME: This setTimeout is demo implementation.
    // please edit and customize this component.
    setTimeout(() => {
      this.onActiveEvent(50);
    }, 1000);
  }

  public setSheetHeight(heightRatio: number): void {
    if (heightRatio >= 35) {
      this.isActive = true;
    }
    let ratio = 0;
    if (heightRatio > 70) {
      ratio = 100;
      this.isFullScreen = true;
    } else if (heightRatio <= 70 && heightRatio >= 35) {
      ratio = 50;
      this.isFullScreen = false;
    } else {
      ratio = 0;
      this.isFullScreen = false;
      this.isActive = false;

      // DELETEME: This setTimeout is demo implementation.
      // please edit and customize this component.
      setTimeout(() => {
        this.onActiveEvent(50);
      }, 1000);
    }

    this.currentPositionY = 100 - ratio; // convert from px to %.
    this.sheetTransform = `translate3d(0, max(${0}px, ${this.currentPositionY}%), 0)`;
    this.mainHeight = `calc(${100 - this.currentPositionY}vh - ${this.bottomPaddingPx}px)`;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }

  public onActiveEvent(heightRatio: number): void {
    this.setSheetHeight(heightRatio);
    this.isActive = true;
  }
  public onCloseEvent(): void {
    this.setSheetHeight(0);
    this.isActive = false;
  }
}
