import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TeamService } from '../../services/team.service';
import { SamarService } from '../../services/samar.service';
import { ActionService } from '../../services/action.service';
import { Team } from '../../models/team.model';
import { SamarMember } from '../../models/samar-member.model';
import { User } from '../../models/user.model';
import { Action } from '../../models/action.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  teams: Team[] = [];
  otherTeams: Array<{team: Team, ownerName: string}> = [];
  leaderboard: Array<{rank: number, team: Team, ownerName: string, totalPoints: number}> = [];
  memberLeaderboard: Array<{rank: number, member: SamarMember}> = [];
  members: SamarMember[] = [];
  allUsers: User[] = [];
  showCreateTeamForm = false;
  newTeamName = '';
  selectedMembers: number[] = [];
  createTeamError = '';
  readonly maxTeamsPerUser = 2;

  // Member Selection Modal
  showMemberSelectionModal = false;
  selectedMemberForActions: SamarMember | null = null;
  actions: Action[] = [];
  showActionForm = false;
  newActionName = '';
  newActionPoints = 0;
  newActionType: 'positive' | 'negative' = 'positive';
  newActionScope: 'single' | 'group' = 'single';
  actionPendingDeleteId: string | null = null;
  teamPendingDeleteId: string | null = null;
  showApplyCelebration = false;
  private celebrationTimeout: ReturnType<typeof setTimeout> | null = null;
  notifyMessage = '';

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private samarService: SamarService,
    private actionService: ActionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.waitForSession().subscribe(user => {
      this.user = user;
      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      this.samarService.getMembersObservable().subscribe(members => {
        this.members = members;
        this.buildMemberLeaderboard(members);
        if (this.selectedMemberForActions) {
          const updated = members.find(m => m.id === this.selectedMemberForActions!.id);
          if (updated) {
            this.selectedMemberForActions = updated;
          }
        }
        this.cdr.detectChanges();
      });
      this.samarService.loadMembers().subscribe();
      this.loadTeams();
    });
  }

  loadTeams(): void {
    if (this.user) {
      this.authService.getAllUsers().subscribe(users => {
        this.allUsers = users;

        this.teamService.loadAllTeams().subscribe(allTeams => {
          // Qua le mie squadre
          this.teams = this.teamService.getTeamsByUser(this.user!.id);

          // Filtra squadre di altri utenti
          this.otherTeams = allTeams
            .filter(t => t.userId !== this.user!.id)
            .map(team => ({
              team,
              ownerName: this.getUsernameById(team.userId) || 'Utente Sconosciuto'
            }));

          // Costruisci la classifica
          this.buildLeaderboard(allTeams);
          this.cdr.detectChanges();
        });
      });
    }
  }

  private getUsernameById(userId: string): string | null {
    const user = this.allUsers.find(u => u.id === userId);
    return user ? user.username : null;
  }

  showNotify(message: string): void {
    this.notifyMessage = message;
    this.cdr.detectChanges();
  }

  closeNotify(): void {
    this.notifyMessage = '';
    this.cdr.detectChanges();
  }

  toggleCreateTeamForm(): void {
    this.showCreateTeamForm = !this.showCreateTeamForm;
    if (!this.showCreateTeamForm) {
      this.resetForm();
    }
    this.cdr.detectChanges();
  }

  toggleMemberSelection(memberId: number): void {
    const index = this.selectedMembers.indexOf(memberId);
    if (index > -1) {
      this.selectedMembers.splice(index, 1);
    } else if (this.selectedMembers.length < 4) {
      this.selectedMembers.push(memberId);
    }
    this.cdr.detectChanges();
  }

  isMemberSelected(memberId: number): boolean {
    return this.selectedMembers.includes(memberId);
  }

  createTeam(): void {
    this.createTeamError = '';

    if (!this.newTeamName.trim()) {
      this.showNotify('Inserisci un nome per la squadra');
      return;
    }

    if (this.selectedMembers.length !== 4) {
      this.showNotify('Seleziona esattamente 4 membri');
      return;
    }

    if (this.user && this.teams.length >= this.maxTeamsPerUser) {
      this.createTeamError = `Hai già raggiunto il numero massimo di ${this.maxTeamsPerUser} squadre`;
      return;
    }

    if (this.user) {
      this.teamService.createTeam(this.newTeamName, this.user.id, this.selectedMembers).subscribe({
        next: () => {
          this.loadTeams();
          this.resetForm();
          this.showCreateTeamForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.createTeamError = err?.error?.error || 'Errore durante la creazione della squadra';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteTeam(teamId: string): void {
    this.teamPendingDeleteId = teamId;
    this.cdr.detectChanges();
  }

  confirmDeleteTeam(): void {
    if (!this.teamPendingDeleteId || !this.user) return;
    this.teamService.deleteTeam(this.teamPendingDeleteId, this.user.id).subscribe(() => {
      this.teamPendingDeleteId = null;
      this.loadTeams();
      this.cdr.detectChanges();
    });
  }

  cancelDeleteTeam(): void {
    this.teamPendingDeleteId = null;
    this.cdr.detectChanges();
  }

  editTeam(teamId: string): void {
    this.router.navigate(['/team', teamId]);
  }

  viewTeamDetails(teamId: string): void {
    this.router.navigate(['/team', teamId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getMemberName(memberId: number): string {
    const member = this.members.find(m => m.id === memberId);
    return member ? member.name : '';
  }

  private resetForm(): void {
    this.newTeamName = '';
    this.selectedMembers = [];
    this.createTeamError = '';
  }

  getTotalTeamPoints(team: Team): number {
    return team.memberPoints.reduce((sum, mp) => sum + mp.totalPoints, 0);
  }

  private buildLeaderboard(allTeams: Team[]): void {
    // Map teams with their points and owner names
    const teamsWithPoints = allTeams.map(team => ({
      rank: 0,
      team,
      ownerName: this.getUsernameById(team.userId) || 'Utente Sconosciuto',
      totalPoints: this.getTotalTeamPoints(team)
    }));

    // Sort by total points descending
    teamsWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks
    teamsWithPoints.forEach((item, index) => {
      item.rank = index + 1;
    });

    this.leaderboard = teamsWithPoints;
  }

  private buildMemberLeaderboard(members: SamarMember[]): void {
    const membersWithPoints = members
      .slice()
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .map((member, index) => ({
        rank: index + 1,
        member
      }));

    this.memberLeaderboard = membersWithPoints;
  }

  // Member Selection Modal Methods
  openMemberSelectionModal(): void {
    if (this.showMemberSelectionModal) {
      this.closeMemberSelectionModal();
      return;
    }
    this.showMemberSelectionModal = true;
    this.samarService.loadMembers().subscribe(); // Ricarica tutti i 7 SAMAR (aggiorna via members$)
    this.actions = this.actionService.getActions();
    this.actionService.loadActions().subscribe(actions => {
      this.actions = actions;
      this.cdr.detectChanges();
    });
    this.cdr.detectChanges();
  }

  closeMemberSelectionModal(): void {
    this.showMemberSelectionModal = false;
    this.selectedMemberForActions = null;
    this.resetActionForm();
    this.cdr.detectChanges();
  }

  selectMemberForActions(member: SamarMember): void {
    if (this.selectedMemberForActions?.id === member.id) {
      this.selectedMemberForActions = null;
    } else {
      this.selectedMemberForActions = member;
    }
    this.cdr.detectChanges();
  }

  toggleActionForm(): void {
    this.showActionForm = !this.showActionForm;
    if (!this.showActionForm) {
      this.resetActionForm();
    }
    this.cdr.detectChanges();
  }

  createAction(): void {
    if (!this.newActionName.trim()) {
      this.showNotify('Completa tutti i campi');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const points = this.newActionType === 'positive' ? this.newActionPoints : -this.newActionPoints;

    this.actionService.addAction({
      name: this.newActionName,
      points,
      type: this.newActionType,
      scope: this.newActionScope,
      createdBy: user.id,
      isGlobal: true
    }).subscribe(() => {
      this.actions = this.actionService.getActions();
      this.resetActionForm();
      this.showActionForm = false;
      this.cdr.detectChanges();
    });
  }

  deleteAction(actionId: string): void {
    this.actionPendingDeleteId = actionId;
    this.cdr.detectChanges();
  }

  confirmDeleteAction(): void {
    if (!this.actionPendingDeleteId) return;
    this.actionService.deleteAction(this.actionPendingDeleteId).subscribe(() => {
      this.actions = this.actionService.getActions();
      this.actionPendingDeleteId = null;
      this.cdr.detectChanges();
    });
  }

  cancelDeleteAction(): void {
    this.actionPendingDeleteId = null;
    this.cdr.detectChanges();
  }

  applyAction(action: Action): void {
    if (action.scope === 'single') {
      // Azione del singolo: applica solo al membro selezionato
      if (!this.selectedMemberForActions) {
        this.showNotify('Seleziona un membro prima di applicare il bonus');
        return;
      }
      this.applyActionToMember(action, this.selectedMemberForActions.id);
    } else if (action.scope === 'group') {
      // Azione di gruppo: applica a tutti i 7 SAMAR della squadra
      this.applyActionToGroup(action);
    }
  }

  private applyActionToMember(action: Action, memberId: number): void {
    this.samarService.applyPointsToMember(memberId, action.id, action.name, action.points).subscribe(() => {
      this.triggerApplyCelebration();
      this.samarService.loadMembers().subscribe(() => {
        this.loadTeams();
      });
    });
  }

  private applyActionToGroup(action: Action): void {
    const allMembers = this.samarService.getMembers();

    const requests = allMembers.map(member =>
      this.samarService.applyPointsToMember(member.id, action.id, action.name, action.points).toPromise()
    );

    Promise.all(requests).then(() => {
      this.triggerApplyCelebration();
      this.samarService.loadMembers().subscribe(() => {
        this.loadTeams();
      });
    });
  }

  private triggerApplyCelebration(): void {
    if (this.celebrationTimeout) {
      clearTimeout(this.celebrationTimeout);
      this.celebrationTimeout = null;
    }
    this.showApplyCelebration = true;
    this.cdr.detectChanges();
    this.celebrationTimeout = setTimeout(() => {
      this.showApplyCelebration = false;
      this.celebrationTimeout = null;
      this.cdr.detectChanges();
    }, 1500);
  }

  private resetActionForm(): void {
    this.newActionName = '';
    this.newActionPoints = 0;
    this.newActionType = 'positive';
    this.newActionScope = 'single';
  }
}
