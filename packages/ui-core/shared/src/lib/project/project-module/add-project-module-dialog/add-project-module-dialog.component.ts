import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NbDialogRef } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { CKEditor4 } from 'ckeditor4-angular/ckeditor';
import { firstValueFrom } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { distinctUntilChange } from '@gauzy/ui-core/common';
import {
	IEmployee,
	IOrganization,
	IOrganizationProject,
	IOrganizationProjectModule,
	IOrganizationSprint,
	IOrganizationTeam,
	ISelectedEmployee,
	ITask,
	ProjectModuleStatusEnum,
	TaskParticipantEnum,
	ID
} from '@gauzy/contracts';
import { TranslationBaseComponent } from '@gauzy/ui-core/i18n';
import {
	EmployeesService,
	OrganizationTeamsService,
	Store,
	OrganizationProjectModuleService,
	SprintService,
	TasksService
} from '@gauzy/ui-core/core';
import { richTextCKEditorConfig } from '../../../ckeditor.config';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'ngx-add-module-dialog',
	templateUrl: './add-project-module-dialog.component.html',
	styleUrls: ['./add-project-module-dialog.component.scss']
})
export class AddProjectModuleDialogComponent extends TranslationBaseComponent implements OnInit {
	employees: IEmployee[] = [];
	teams: IOrganizationTeam[] = [];
	selectedMembers: string[] = [];
	selectedTeams: string[] = [];
	tasks: ITask[] = [];
	organizationSprints: IOrganizationSprint[] = [];
	availableParentModules: IOrganizationProjectModule[] = [];
	organization: IOrganization;
	taskParticipantEnum = TaskParticipantEnum;
	participants = TaskParticipantEnum.EMPLOYEES;
	ckConfig: CKEditor4.Config = richTextCKEditorConfig;
	projectModuleStatuses = Object.values(ProjectModuleStatusEnum);
	form: UntypedFormGroup = this.fb.group({
		name: ['', Validators.required],
		description: [''],
		status: [ProjectModuleStatusEnum.BACKLOG],
		startDate: ['', Validators.required],
		endDate: ['', Validators.required],
		isFavorite: [false],
		parentId: [],
		projectId: [null, Validators.required],
		managerId: [],
		members: [],
		organizationSprints: [],
		teams: [],
		tasks: []
	});

	@Input() createModule = false;

	private _projectModule: IOrganizationProjectModule;
	get projectModule(): IOrganizationProjectModule {
		return this._projectModule;
	}
	@Input() set projectModule(value: IOrganizationProjectModule) {
		this._projectModule = value;

		this.populateForm(value);
	}

	private _project: IOrganizationProject;
	get project(): IOrganizationProject {
		return this._project;
	}
	@Input() set project(value: IOrganizationProject) {
		this._project = value;
		this.form.get('projectId').setValue(value?.id || null);
	}

	constructor(
		public dialogRef: NbDialogRef<AddProjectModuleDialogComponent>,
		private fb: UntypedFormBuilder,
		private store: Store,
		public translateService: TranslateService,
		private employeesService: EmployeesService,
		private organizationTeamsService: OrganizationTeamsService,
		private organizationProjectModuleService: OrganizationProjectModuleService,
		private organizationSprintService: SprintService,
		private readonly tasksService: TasksService
	) {
		super(translateService);
	}

	/**
	 * Initializes component and loads necessary data.
	 */
	ngOnInit() {
		this.ckConfig.editorplaceholder = this.translateService.instant('FORM.PLACEHOLDERS.DESCRIPTION');
		this.loadOrganizationData();
		this.loadAvailableParentModules();
		this.loadTasks();
		this.findOrganizationSprints();
	}

	/**
	 * Populates form fields with data from an existing project module.
	 * @param module - The selected project module data.
	 */
	private populateForm(module: IOrganizationProjectModule) {
		if (!module) return;
		this.form.patchValue({
			name: module.name,
			description: module.description,
			status: module.status,
			startDate: module.startDate,
			endDate: module.endDate,
			isFavorite: module.isFavorite,
			projectId: module.projectId,
			parentId: module.parentId,
			managerId: module.managerId,
			members: (module.members || [])?.map((m) => m.id),
			organizationSprints: module.organizationSprints,
			teams: (module.teams || [])?.map((t) => t.id),
			tasks: (module.tasks || [])?.map((task) => task.id)
		});
		this.selectedMembers = module.members?.map((m) => m.id);
		this.selectedTeams = module.teams?.map((t) => t.id);
	}

	/**
	 * Validates and saves the form data to create or update the project module.
	 */
	onSave() {
		if (this.form.invalid) return;
		this.createOrUpdateModule();
	}

	/**
	 * Creates a new project module or updates the existing module based on form data.
	 */
	private async createOrUpdateModule() {
		const organizationId = this.organization.id;

		this.form.get('members').setValue(
			(this.selectedMembers || []).map((id) => this.employees.find((e) => e.id === id)).filter((e) => !!e) // Only valid employees
		);

		this.form.get('teams').setValue(
			(this.selectedTeams || []).map((id) => this.teams.find((e) => e.id === id)).filter((e) => !!e) // Only valid teams
		);

		this.form.get('tasks').setValue(
			(this.form.get('tasks').value || []).map((id) => this.tasks.find((e) => e.id === id)).filter((e) => !!e) // Only valid teams
		);

		const formValue = { ...this.form.value, organizationId, organization: this.organization };

		if (this.createModule) {
			try {
				const module = await firstValueFrom(this.organizationProjectModuleService.create(formValue));
				this.dialogRef.close(module);
			} catch (error) {
				console.error('Failed to create module:', error);
			}
		} else {
			try {
				const module = await firstValueFrom(
					this.organizationProjectModuleService.update(this.projectModule.id, { ...formValue })
				);
				this.dialogRef.close(module);
			} catch (error) {
				console.error('Failed to update module:', error);
			}
		}
	}

	/**
	 * Loads selected organization data and initializes employees and teams.
	 */
	async loadOrganizationData() {
		const organization$ = this.store.selectedOrganization$;
		organization$
			.pipe(
				distinctUntilChange(),
				filter(Boolean),
				tap((org: IOrganization) => (this.organization = org)),
				tap(() => this.loadEmployees()),
				tap(() => this.loadTeams()),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Loads the employees for the currently selected organization.
	 *
	 * Retrieves all employees associated with the current organization and tenant,
	 * including their user details, and assigns them to the `employees` property.
	 */
	async loadEmployees(): Promise<void> {
		if (!this.organization) return;

		const { id: organizationId, tenantId } = this.organization;

		try {
			const { items: employees = [] } = await firstValueFrom(
				this.employeesService.getAll(['user'], { organizationId, tenantId })
			);
			this.employees = employees;
		} catch (error) {
			console.error('Failed to load employees:', error);
			this.employees = [];
		}
	}

	/**
	 * Loads available teams for the selected organization.
	 *
	 * Retrieves all teams associated with the current organization and tenant,
	 * including their members, and assigns them to the `teams` property.
	 */
	async loadTeams(): Promise<void> {
		if (!this.organization) return;

		const { id: organizationId, tenantId } = this.organization;

		try {
			const { items: teams = [] } = await this.organizationTeamsService.getAll(['members'], {
				organizationId,
				tenantId
			});
			this.teams = teams;
		} catch (error) {
			this.teams = [];
		}
	}

	/**
	 * Loads available tasks for the selected project and organization.
	 *
	 * Retrieves all tasks associated with the current organization, tenant,
	 * and selected project, then assigns them to the `tasks` property.
	 */
	async loadTasks(): Promise<void> {
		if (!this.organization) return;

		const { id: organizationId, tenantId } = this.organization;
		const projectId = this.form.get('projectId')?.value;

		try {
			const { items: tasks = [] } = await firstValueFrom(
				this.tasksService.getAllTasks({ projectId, organizationId, tenantId })
			);
			this.tasks = tasks;
		} catch (error) {
			this.tasks = [];
		}
	}

	/**
	 * Loads available parent modules based on the selected project ID.
	 *
	 * Retrieves parent modules associated with the selected project and assigns
	 * them to the `availableParentModules` property.
	 */
	private async loadAvailableParentModules(): Promise<void> {
		if (!this.organization) return;

		const projectId = this.form.get('projectId')?.value;

		try {
			const modules = await firstValueFrom(
				this.organizationProjectModuleService.getAllModulesByProjectId({ projectId })
			);
			this.availableParentModules = modules?.items || [];
		} catch (error) {
			this.availableParentModules = [];
		}
	}

	/**
	 * Fetches sprints associated with the organization.
	 */
	findOrganizationSprints(): void {
		this.organizationSprintService.getAllSprints().subscribe({
			next: (sprints) => {
				this.organizationSprints = sprints.items;
			},
			error: (error) => {
				console.error('Error fetching organization sprints:', error);
			}
		});
	}

	/**
	 * Updates the selected manager ID in the form.
	 * @param selectedManagerId - The selected manager's ID.
	 */
	onManagerSelected(employee: ISelectedEmployee) {
		// Check if the provided value is an array; if so, take the first element, otherwise use the value directly
		this.form.get('managerId').setValue(employee.id);
	}

	/**
	 * Updates the selected teams based on the user's selection.
	 *
	 * @param teamsSelection - An array of team IDs selected by the user.
	 */
	onTeamsSelected(teamsSelection: ID[]): void {
		this.selectedTeams = [...teamsSelection];
	}

	/**
	 * Updates the selected members based on the user's selection.
	 *
	 * @param members - An array of member IDs selected by the user.
	 */
	onMembersSelected(members: ID[]): void {
		this.selectedMembers = [...members];
	}
}
