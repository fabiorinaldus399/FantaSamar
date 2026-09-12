import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SamarMember } from '../models/samar-member.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class SamarService {
  private members: SamarMember[] = [];

  private membersSubject = new BehaviorSubject<SamarMember[]>(this.members);
  public members$ = this.membersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMembers();
  }

  loadMembers(): Observable<SamarMember[]> {
    const request = this.http.get<SamarMember[]>(`${API_BASE_URL}/members`).pipe(
      tap(members => {
        this.members = members;
        this.membersSubject.next(this.members);
      })
    );
    request.subscribe();
    return request;
  }

  getMembers(): SamarMember[] {
    return this.members;
  }

  getMemberById(id: number): SamarMember | undefined {
    return this.members.find(m => m.id === id);
  }

  getMembersObservable(): Observable<SamarMember[]> {
    return this.members$;
  }

  applyPointsToMember(memberId: number, actionId: string, actionName: string, points: number): Observable<SamarMember> {
    return this.http.post<SamarMember>(`${API_BASE_URL}/members/${memberId}/points`, { actionId, actionName, points }).pipe(
      tap(updatedMember => {
        this.members = this.members.map(m => m.id === memberId ? updatedMember : m);
        this.membersSubject.next(this.members);
      })
    );
  }

  // Cronologia di tutti i bonus/malus applicati a un membro, indipendente da qualsiasi squadra
  getMemberHistory(memberId: number): Observable<Array<{actionId: string, actionName: string, points: number, appliedAt: string}>> {
    return this.http.get<Array<{actionId: string, actionName: string, points: number, appliedAt: string}>>(`${API_BASE_URL}/members/${memberId}/history`);
  }
}

