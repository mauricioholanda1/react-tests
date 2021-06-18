import {RemoteAuthentication} from './remote-authentication';
import {mockAccountModel, mockAuthentication} from '@/domain/test';
import {HttpPostClientSpy} from '@/data/test';
import {InvalidCredentialsError, UnexpectedError} from '@/domain/errors';
import {HttpStatusCode} from '@/data/protocols/http';
import {AccountModel} from '@/domain/models';
import {AuthenticationParams} from '@/domain/usecases';
import faker from 'faker';

type SutTypes = {
  sut: RemoteAuthentication;
  httpPostClientSpy: HttpPostClientSpy<AuthenticationParams, AccountModel>;
};

const makeSut = (url: string = faker.internet.url()): SutTypes => {
  const httpPostClientSpy = new HttpPostClientSpy<
    AuthenticationParams,
    AccountModel
  >();
  const sut = new RemoteAuthentication(url, httpPostClientSpy);
  return {sut, httpPostClientSpy};
};

describe('RemoteAuthentication', () => {
  test('Shoud call HttpPostClient with corret URL', async () => {
    const url = faker.internet.url();
    const {sut, httpPostClientSpy} = makeSut(url);
    await sut.auth(mockAuthentication());
    expect(httpPostClientSpy.url).toBe(url);
  });

  test('Shoud call HttpPostClient with corret body', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    const authenticationParams = mockAuthentication();
    await sut.auth(authenticationParams);
    expect(httpPostClientSpy.body).toEqual(authenticationParams);
  });

  test('Shoud throw invalidCredentialError if HttpPostClient return 401', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.unauthorized,
    };
    const promise = sut.auth(mockAuthentication());
    await expect(promise).rejects.toThrow(new InvalidCredentialsError());
  });

  test('Shoud throw UnexpectedError if HttpPostClient return 500', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.serverError,
    };
    const promise = sut.auth(mockAuthentication());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('Shoud throw UnexpectedError if HttpPostClient return 404', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.notFound,
    };
    const promise = sut.auth(mockAuthentication());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('Shoud return an AccountModel if HttpPostClient return 200', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    const httpResult = mockAccountModel();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.ok,
      body: httpResult,
    };
    const account = await sut.auth(mockAuthentication());
    expect(account).toEqual(httpResult);
  });
});
