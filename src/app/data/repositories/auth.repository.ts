import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../../core/models/usuario.model';
import { AuthPort } from '../../core/ports/auth.port';

const API_URL = 'https://localhost:7116/api/Usuarios/autenticar';
const SESSION_KEY = 'auth_session';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutos

interface StoredSession {
  user: Usuario;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthRepository extends AuthPort {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private _currentUser = signal<Usuario | null>(null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  currentUser = this._currentUser.asReadonly();

  constructor() {
    super();
    this.restoreSession();
  }

  isAuthenticated(): boolean {
    return this._currentUser() !== null;
  }

  login(nome: string, senha: string): Observable<Usuario> {
    return this.http.post<Usuario>(API_URL, { nome, senha }).pipe(
      tap(user => {
        this._currentUser.set(user);
        this.saveSession(user);
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  private saveSession(user: Usuario): void {
    if (!this.isBrowser) return;
    const session: StoredSession = {
      user,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private restoreSession(): void {
    if (!this.isBrowser) return;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;

    try {
      const session: StoredSession = JSON.parse(raw);
      if (Date.now() < session.expiresAt) {
        this._currentUser.set(session.user);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  getSessionExpiresAt(): number | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session: StoredSession = JSON.parse(raw);
      return session.expiresAt;
    } catch {
      return null;
    }
  }
}
