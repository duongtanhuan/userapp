import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';
import { UserService } from '../service/user.service';
import { NotificationService } from '../service/notification.service';
import { NotificationType } from '../enum/notification-type';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { FileUploadStatus } from '../model/file-upload.status';
import { CustomHttpResponse } from '../model/custom-htp-respone';
import { Role } from '../enum/role.enum';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public refreshing: boolean;
  private subscriptions: Subscription[] = [];
  public users: User[];
  public filename: any;
  public profileImage: any;
  public selectedUser: any;
  public editUser = new User();
  private currentUsername: string;
  public user: User;
  public fileStatus = new FileUploadStatus();

  constructor(private router: Router, private authenticationService: AuthenticationService,
    private userService: UserService, private notificationService: NotificationService) { }



  ngOnInit(): void {
    this.user = this.authenticationService.getUserFromLocalCache();
    this.getUsers(true);
  }

  private reportUploadProgress(event: HttpEvent<any>): void {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event?.loaded && event?.total) {
          this.fileStatus.percentage = Math.round(100 * event.loaded / event.total);
        }
        this.fileStatus.status = 'progress';
        break;
      case HttpEventType.Response:
        if (event.status === 200) {
          this.user.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCESS, `${event.body.firstName}\'s profile image updated successfully`);
          this.fileStatus.status = 'done';
          break;
        } else {
          this.sendNotification(NotificationType.ERROR, `Unable to upload image. Please try again`)
          break;
        }
      default:
        `Finished all processes`;
    } 
  }

  public updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  public onDeleteUser(username: string): void {
    this.subscriptions.push(
      this.userService.deleteUser(username).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.getUsers(false);
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
        }
      )
    )
  }

  public get isAdmin(): boolean {
    console.log(this.getUserRole())
    return this.getUserRole() === Role.ADMIN || this.getUserRole() === Role.SUPER_ADMIN;
  }

  public get isManager(): boolean {
    return this.isAdmin || this.getUserRole() === Role.MANAGER;
  }

  public get isAdminOrManager(): boolean {
    return this.isAdmin || this.isManager;
  }

  private getUserRole(): string {
    return this.authenticationService.getUserFromLocalCache().role;
  }

  public onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append('username', this.user.userName);
    formData.append('profileImage', this.profileImage);
    this.subscriptions.push(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportUploadProgress(event);
          this.getUsers(false);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
        }
      )
    );
  }

  public onLogout():void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }

  public onUpdateCurrentUser(user: User) {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().userName;
    const formData = this.userService.createUserFormData(this.currentUsername
      , user, this.profileImage);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.getUsers(false);
          this.filename = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
          this.filename = null;
          this.profileImage = null;
        }
      )
    )
  }

  public searchUsers(searchTerm: string): void {
    const results: User[] = [];
    console.log(searchTerm, results);

    for (const user of this.userService.getUsersFromLocalCache()) {
      const firstName: string = user.firstName;
      const lastName: string = user.lastName;
      const userName: string = user.userName;
      const userId: string = user.userId;
      if (firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        userName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
        userId.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
        results.push(user);
      }
    }
    this.users = results;
    if (results.length === 0 || !searchTerm) {
      this.users = this.userService.getUsersFromLocalCache();
    }
  }

  public onUpdateUser(): void {
    const formData = this.userService.createUserFormData(this.currentUsername
      , this.editUser, this.profileImage);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false);
          this.filename = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESS
            , `${response.lastName} updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.filename = null;
          this.profileImage = null;
        }
      )
    );
  }
  public onProfileImageChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const profileImage: File = (target.files as FileList)[0];
    this.filename = profileImage.name;
    this.profileImage = profileImage;
    console.log(this.filename, this.profileImage)
  }

  public onEditUser(editUser: User): void {
    this.editUser = editUser;
    this.currentUsername = editUser.userName;
    this.clickButton('openUserEdit');
  }

  public onSelectUser(appUser: User): void {
    this.selectedUser = appUser;
    this.clickButton('openUserInfo');
  }

  public saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage);
    this.subscriptions.push(
      this.userService.addUser(formData).subscribe(
        (response: User) => {
          this.clickButton('new-user-close');
          this.getUsers(false);
          this.filename = null;
          this.profileImage = null;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESS
            , `${response.firstName} ${response.lastName} added successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.filename = null;
          this.profileImage = null;
        }
      )

    );
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId)?.click();
  }
  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response: User[]) => {
          this.userService.addUsersToLocalCache(response);
          this.users = response;
          this.refreshing = false;
          if (showNotification) {
            this.sendNotification(NotificationType.SUCCESS, `${response.length} user(s) loaded successfully.`)
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        }
      )
    );
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if (message) {
      this.notificationService.notify(notificationType, message);
    } else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again.');
    }
  }

  public changeTitle(title: string): void {
    this.titleSubject.next(title);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
