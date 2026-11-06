import { Routes } from '@angular/router';
import { PersonalData } from './pages/personal-data/personal-data';

export const routes: Routes = [
  { 
    path: 'personal-data', 
    component: PersonalData 
  },
  { 
    path: '', 
    redirectTo: 'personal-data', 
    pathMatch: 'full' 
  }
];