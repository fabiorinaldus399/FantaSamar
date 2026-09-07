import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, filter } from 'rxjs';
import { User } from '../models/user.model';
import { API_BASE_URL } from '../config/api.config';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private sessionReadySubject = new BehaviorSubject<boolean>(false);
  public sessionReady$ = this.sessionReadySubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  register(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, { username, password }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  login(username: string, password: string, rememberDevice: boolean = true): Observable<boolean> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { username, password, rememberDevice }).pipe(
      tap(response => this.setSession(response, rememberDevice)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Restituisce un Observable che emette lo user corrente una volta terminato il tentativo di ripristino sessione. */
  waitForSession(): Observable<User | null> {
    if (this.sessionReadySubject.value) {
      return of(this.currentUserSubject.value);
    }
    return this.sessionReady$.pipe(
      filter(ready => ready),
      map(() => this.currentUserSubject.value)
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/users`);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      this.sessionReadySubject.next(true);
      return;
    }

    this.http.get<User>(`${API_BASE_URL}/auth/me`).subscribe({
      next: user => {
        this.currentUserSubject.next(user);
        this.sessionReadySubject.next(true);
      },
      error: () => {
        this.logout();
        this.sessionReadySubject.next(true);
      }
    });
  }

  private setSession(response: AuthResponse, rememberDevice: boolean = true): void {
    if (rememberDevice) {
      localStorage.setItem('authToken', response.token);
      sessionStorage.removeItem('authToken');
    } else {
      sessionStorage.setItem('authToken', response.token);
      localStorage.removeItem('authToken');
    }
    this.currentUserSubject.next(response.user);
  }
}
