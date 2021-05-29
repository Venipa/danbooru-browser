import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse
} from "axios";
import defu from "defu";
import { App } from "vue";
import { VueAxiosInstance } from "./axios-typings";

// @ts-ignore
const axiosExtra: VueAxiosInstance = {
  setBaseURL(baseURL) {
    this.defaults!.baseURL = baseURL;
  },
  setHeader(name, value, scopes = "common") {
    for (const scope of Array.isArray(scopes) ? scopes : [scopes]) {
      if (!value) {
        delete this.defaults!.headers[scope][name];
        return;
      }
      this.defaults!.headers[scope][name] = value;
    }
  },
  setToken(token, type, scopes = "common") {
    const value = !token ? undefined : (type ? type + " " : "") + token;
    this.setHeader("Authorization", value, scopes);
  },
  onRequest(fn) {
    this.interceptors.request.use((config) => fn(config) || config);
  },
  onResponse(fn) {
    this.interceptors.response.use((response) => fn(response) || response);
  },
  onRequestError(fn) {
    this.interceptors.request.use(
      undefined,
      (error) => fn(error) || Promise.reject(error)
    );
  },
  onResponseError(fn) {
    this.interceptors.response.use(
      undefined,
      (error) => fn(error) || Promise.reject(error)
    );
  },
  onError(fn) {
    this.onRequestError(fn);
    this.onResponseError(fn);
  },
  create(options) {
    return createAxiosInstance(defu(options || {}, this.defaults));
  },
};
// Request helpers ($get, $post, ...)
for (const method of [
  "request",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "patch",
]) {
  (axiosExtra as any)["$" + method] = function(...args: any[]) {
    return this[method].apply(this, args).then((res: AxiosResponse<any>) => res && res.data); // eslint-disable-line prefer-spread
  };
}


const extendAxiosInstance = (axios: AxiosInstance) => {
  for (const key in axiosExtra) {
    // @ts-ignore
    axios[key] = axiosExtra[key].bind(axios);
  }
};
export const createAxiosInstance = (axiosOptions?: AxiosRequestConfig) => {
  // Create new axios instance
  const axios: VueAxiosInstance = Axios.create(axiosOptions) as any;

  // Extend axios proto
  extendAxiosInstance(axios);

  // Intercept to apply default headers
  axios.onRequest((config) => {
    config.headers = { ...axios.defaults.headers.common, ...config.headers };
  });

  return axios;
};

export default {
  install(
    app: App<any>,
    options?: Partial<{
      baseUrl: string;
      headers: { [key: string]: any };
      debug: boolean;
    }>
  ) {
    app.config.globalProperties.$axios = createAxiosInstance({
      headers: options?.headers,
      baseURL: options?.baseUrl,
    });
  },
};
