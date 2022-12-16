import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BottomSheetComponent } from './bottom-sheet.component';

@NgModule({
  declarations: [BottomSheetComponent],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [BottomSheetComponent],
})
export class BottomSheetModule {}
