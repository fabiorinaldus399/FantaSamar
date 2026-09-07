import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TeamService } from '../../services/team.service';
import { SamarService } from '../../services/samar.service';
import { ActionService } from '../../services/action.service';
import { Team } from '../../models/team.model';
import { MemberPoints } from '../../models/member-points.model';
import { SamarMember } from '../../models/samar-member.model';
import { Action } from '../../models/action.model';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-detail.component.html',
  styleUrls: ['./team-detail.component.css']
})
export class TeamDetailComponent implements OnInit {
  team: Team | null = null;
  isOwner: boolean = false;
  currentUserId: string | null = null;
  members: SamarMember[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private teamService: TeamService,
    private samarService: SamarService,
    private actionService: ActionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.waitForSession().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.currentUserId = user.id;
      this.samarService.loadMembers().subscribe(members => {
        this.members = members;
        this.cdr.detectChanges();
      });

      this.route.params.subscribe((params: any) => {
        const teamId = params['id'];
        this.teamService.loadTeamById(teamId).subscribe({
          next: foundTeam => {
            this.team = foundTeam;
            this.isOwner = this.team.userId === user.id;
            this.cdr.detectChanges();
          },
          error: () => this.router.navigate(['/dashboard'])
        });
      });
    });
  }

  getMemberName(memberId: number): string {
    const member = this.members.find(m => m.id === memberId);
    return member ? member.name : '';
  }

  getTotalTeamPoints(): number {
    if (!this.team) return 0;
    return this.team.memberPoints.reduce((sum, mp) => sum + mp.totalPoints, 0);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
