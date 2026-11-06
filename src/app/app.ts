import { Component } from '@angular/core';
import { PersonalData } from './pages/personal-data/personal-data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ PersonalData],
  template: `<app-personal-data></app-personal-data>`
})
export class AppComponent {
  title = 'angular_proyecto_final_Yoselin_Nefi';
}