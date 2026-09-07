import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isLogin = true;
  username = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;
  rememberDevice = true;
  showRegisterSuccessOverlay = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberDevice = true;
    }

    this.authService.waitForSession().subscribe(user => {
      if (user) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.resetForm();
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    if (this.isLogin) {
      this.handleLogin();
    } else {
      this.handleRegister();
    }
  }

  private handleLogin(): void {
    if (!this.username || !this.password) {
      this.error = 'Inserisci username e password';
      this.loading = false;
      return;
    }

    this.authService.login(this.username, this.password, this.rememberDevice).subscribe(success => {
      if (success) {
        if (this.rememberDevice) {
          localStorage.setItem('rememberedUsername', this.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Username o password non validi';
        this.loading = false;
      }
    });
  }

  private handleRegister(): void {
    if (!this.username || !this.password || !this.confirmPassword) {
      this.error = 'Compila tutti i campi';
      this.loading = false;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Le password non corrispondono';
      this.loading = false;
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La password deve avere almeno 6 caratteri';
      this.loading = false;
      return;
    }

    this.authService.register(this.username, this.password).subscribe(success => {
      if (success) {
        this.error = '';
        this.isLogin = true;
        this.resetForm();
        this.showRegisterSuccessOverlay = true;
      } else {
        this.error = 'Username già in uso';
        this.loading = false;
      }
    });
  }

  closeRegisterSuccessOverlay(): void {
    this.showRegisterSuccessOverlay = false;
  }

  private resetForm(): void {
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.error = '';
    this.loading = false;
  }
}
