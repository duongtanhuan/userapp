import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpResponse} from '@angular/common/http';
import { User } from '../model/user';
import { Observable, Observer } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CustomHttpResponse } from '../model/custom-htp-respone';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private host = environment.apiUrl;
  private users: any;

  constructor(private http: HttpClient) {}      

  public login(user: User): Observable<HttpResponse<any> | HttpErrorResponse> {
    return this.http.post<HttpResponse<any> | HttpErrorResponse> (`${this.host}/user/login`, user, {observe: 'response'})
  }

  public getUsers(): Observable<any> {
    return this.http.get<User[]>(`${this.host}/user/list`);
  }

  public addUser(formdata: FormData): Observable<User> {
    return this.http.post<User>(`${this.host}/user/add`, formdata);
  }

  public updateUser(formdata: FormData): Observable<User> {
    return this.http.post<User>(`${this.host}/user/update`, formdata);
  }

  public resetPassword(email: string): Observable<CustomHttpResponse | HttpErrorResponse> {
    return this.http.get<CustomHttpResponse>(`${this.host}/user/resetpassword/${email}`)
  }

  public updateProfileImage(formdata: FormData): Observable<HttpEvent<User>> {
    return this.http.post<User>(`${this.host}/user/updateProfileImage`, formdata,
    {
      reportProgress: true,
      observe:'events'
    });
  }

  public deleteUser(username: string): Observable<CustomHttpResponse> {
    return this.http.delete<CustomHttpResponse>(`${this.host}/user/delete/${username}`);
  }

  public addUsersToLocalCache(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  public getUsersFromLocalCache(): User[] | any {
    this.users = localStorage.getItem('users');
    if (this.users) {
      return JSON.parse(this.users);
    }
    return null;
  }

  public createUserFormData(loggedInUsername: any, user: any, profileImage: File): FormData {
    const formData = new FormData();
    formData.append('currentUsername', loggedInUsername);
    formData.append('firstName', user.firstName);
    formData.append('lastName', user.lastName);
    formData.append('username', user.userName);
    formData.append('email', user.email);
    formData.append('role', user.role);
    formData.append('profileImage', profileImage);
    formData.append('isActive', JSON.stringify(user.isActive));
    formData.append('isNonLocked', JSON.stringify(user.isNotLocked));
    return formData;
  }

}

