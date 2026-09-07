import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Action } from '../models/action.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ActionService {
  private actions: Action[] = [];
  private actionsSubject = new BehaviorSubject<Action[]>([]);
  public actions$ = this.actionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadActions();
  }

  getActions(): Action[] {
    return this.actions;
  }

  getActionsObservable(): Observable<Action[]> {
    return this.actions$;
  }

  loadActions(): Observable<Action[]> {
    const request = this.http.get<Action[]>(`${API_BASE_URL}/actions`).pipe(
      tap(actions => {
        this.actions = actions;
        this.actionsSubject.next(this.actions);
      })
    );
    request.subscribe();
    return request;
  }

  addAction(action: Omit<Action, 'id' | 'createdAt'>): Observable<Action> {
    return this.http.post<Action>(`${API_BASE_URL}/actions`, action).pipe(
      tap(newAction => {
        this.actions.push(newAction);
        this.actionsSubject.next(this.actions);
      })
    );
  }

  updateAction(id: string, updates: Partial<Action>): Observable<Action> {
    return this.http.put<Action>(`${API_BASE_URL}/actions/${id}`, updates).pipe(
      tap(updated => {
        const index = this.actions.findIndex(a => a.id === id);
        if (index > -1) {
          this.actions[index] = updated;
          this.actionsSubject.next(this.actions);
        }
      })
    );
  }

  deleteAction(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE_URL}/actions/${id}`).pipe(
      tap(() => {
        this.actions = this.actions.filter(a => a.id !== id);
        this.actionsSubject.next(this.actions);
      })
    );
  }
}
