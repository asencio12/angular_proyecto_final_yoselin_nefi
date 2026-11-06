import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule
  ],
  templateUrl: './personal-data.html',
  styleUrl: './personal-data.css'
})
export class PersonalData {
  private fb = new FormBuilder();

  personalDataForm = this.fb.group({
    firstName: ['', Validators.required],
    secondName: ['UMES', Validators.required],
    firstLastName: ['', Validators.required],
    secondLastName: ['UNIVERSIDAD'],
    birthDate: ['', [Validators.required]]
  });

  save() {
    const data = this.personalDataForm.value;
    localStorage.setItem('personalDataJSON', JSON.stringify(data));
    alert('Información guardada en Local Storage');
  }
}