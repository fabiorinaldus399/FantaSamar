import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Team } from '../models/team.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teams: Team[] = [];
  private teamsSubject = new BehaviorSubject<Team[]>([]);
  public teams$ = this.teamsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTeamsByUser(userId: string): Team[] {
    return this.teams.filter(t => t.userId === userId);
  }

  getAllTeams(): Team[] {
    return this.teams;
  }

  getTeamById(id: string): Team | undefined {
    return this.teams.find(t => t.id === id);
  }

  loadAllTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${API_BASE_URL}/teams`).pipe(
      tap(teams => {
        this.teams = teams;
        this.teamsSubject.next(this.teams);
      })
    );
  }

  loadTeamById(id: string): Observable<Team> {
    return this.http.get<Team>(`${API_BASE_URL}/teams/${id}`).pipe(
      tap(team => {
        const index = this.teams.findIndex(t => t.id === id);
        if (index > -1) {
          this.teams[index] = team;
        } else {
          this.teams.push(team);
        }
        this.teamsSubject.next(this.teams);
      })
    );
  }

  createTeam(name: string, userId: string, memberIds: number[]): Observable<Team> {
    if (memberIds.length !== 4) {
      throw new Error('Una squadra deve avere esattamente 4 membri');
    }

    return this.http.post<Team>(`${API_BASE_URL}/teams`, { name, memberIds }).pipe(
      tap(newTeam => {
        this.teams.push(newTeam);
        this.teamsSubject.next(this.teams);
      })
    );
  }

  deleteTeam(id: string, userId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE_URL}/teams/${id}`).pipe(
      tap(() => {
        this.teams = this.teams.filter(t => t.id !== id);
        this.teamsSubject.next(this.teams);
      })
    );
  }

  addPointsToMember(teamId: string, memberId: number, actionId: string, actionName: string, points: number): Observable<Team> {
    return this.http.post<Team>(`${API_BASE_URL}/teams/${teamId}/points`, { memberId, actionId, actionName, points }).pipe(
      tap(updatedTeam => {
        const index = this.teams.findIndex(t => t.id === teamId);
        if (index > -1) {
          this.teams[index] = updatedTeam;
        } else {
          this.teams.push(updatedTeam);
        }
        this.teamsSubject.next(this.teams);
      })
    );
  }
}

