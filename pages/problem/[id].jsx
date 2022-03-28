/* eslint-disable react-hooks/rules-of-hooks */
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/layout";
import format from "date-fns/format";
import withSession from "lib/session";
import axios from "axios";
import AsyncSelect from "react-select/async";
import { useEffect, useState } from "react";
import { SourcePill } from "components/problems/status-badge";
import { CardTitle } from "components/ui/card-title";
import { Controller, useForm } from "react-hook-form";
import Select, { components } from "react-select";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { ButtonCircle } from "components/ui/button/button-circle";
import { Spinner } from "components/ui/spinner";
import {
  styledReactSelect,
  styledReactSelectAdd,
} from "../../components/utils";
import {
  PencilIcon,
  XIcon,
  CheckIcon,
  CalendarIcon,
  UserCircleIcon,
} from "@heroicons/react/solid";

export const getServerSideProps = withSession(async function ({ req, params }) {
  const user = req.session.get("user");
  if (!user) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const res = await fetch(
    `http://127.0.0.1:3030/v1/probman/problem/${params.id}`
  );
  const data = await res.json();
  return {
    props: {
      user: user,
      problem: data,
      idProblem: params.id,
    },
  };
});

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ProblemDetail({ user, problem, idProblem }) {
  if (!user) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const [editMode, setEditMode] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      problemName: problem.data.problemName,
      idApps: problem.data.app
        ? {
            label: problem.data.app.subname,
            value: problem.data.app.id,
          }
        : false,
      jiraProblem: problem.data.jiraProblem,
      idUrgency: problem.data.urgency
        ? {
            label: problem.data.urgency.urgency,
            value: problem.data.urgency.id,
          }
        : false,
      idImpact: problem.data.impact
        ? {
            label: problem.data.impact.impact,
            value: problem.data.impact.id,
          }
        : false,
      idSource: problem.data.problemSource
        ? {
            label: problem.data.problemSource.label,
            value: problem.data.problemSource.id,
          }
        : false,
    },
  });

  const router = useRouter();

  // Get data User
  const [assignOptions, setAssignOptions] = useState([]);
  useEffect(() => {
    axios
      .get("http://127.0.0.1:3030/v1/probman/user/all")
      .then((response) => {
        const data = response.data.data.map((d) => ({
          value: d.id,
          label: d.fullName,
        }));
        setAssignOptions(data);
      })
      .catch((err) => toast.error(`Assign ${err}`));
  }, []);

  const onSubmit = async (data) => {
    Object.assign(data, {
      id: problem.data.id,
    });
    console.log(data)
    axios
      .put(
        `http://127.0.0.1:3030/v1/probman/problem/${problem.data.id}`,
        data,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      )
      .then(function (response) {
        !isSubmitting;
        if (response) {
          toast.success("Problem Successfully Updated");
          setTimeout(() => router.reload(), 500);
        } else {
          toast.error(`Failed to update: ${response.data.message}`);
        }
      })
      .catch(function (error) {
        // Error 😨
        toast.error(`Failed to update: ${error.response.data.message}`);
      });
  };

  const makeAssign = async (data, event) => {
    event.preventDefault();
    let dataAssign = {}
    Object.assign(dataAssign, {
      idStatus: 2,
      updatedBy: user.id,
      assignedTo: parseInt(event.target.assignedTo.value)
    });
    // console.log(dataAssign)
    axios
      .put(
        `http://127.0.0.1:3030/v1/probman/incident/recprob/${idProblem}`,
        dataAssign,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      )
      .then(function (response) {
        if (response) {
          toast.success("Problem Sucessfully Assigned");
          setTimeout(() => router.reload(), 500);
        }
      })
      .catch((error) => {
        if (error.response) {
          toast.error(
            `${error.response.data.message} (Code: ${error.response.status})`
          );
        } else if (error.request) {
          toast.error(`Request: ${error.request}`);
        } else {
          toast.error(`Message: ${error.message}`);
        }
      });
  };

  // Get Data Aplikasi Async
  const loadApplications = (value, callback) => {
    clearTimeout(timeoutId);

    if (value.length < 3) {
      return callback([]);
    }

    const timeoutId = setTimeout(() => {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_API_URL}/parameters/app?subName=${value}`
        )
        .then((res) => {
          const cachedOptions = res.data.data.map((d) => ({
            value: d.id,
            label: d.subName,
          }));

          callback(cachedOptions);
        })
        .catch((err) => toast.error(`Application ${err}`));
    }, 500);
  };

  const NoOptionsMessage = (props) => {
    return (
      <components.NoOptionsMessage {...props}>
        <span>Type at least 3 letters of application name</span>
      </components.NoOptionsMessage>
    );
  };

  const handleAppChange = (event) => {
    if (event == null) {
      setApps("");
    } else {
      setApps(event.value);
    }
  };

  // Get data Urgency
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/parameters/urgency?isActive=Y`)
      .then((response) => {
        const data = response.data.data.map((d) => ({
          value: d.id,
          label: d.urgency,
        }));
        setUrgencyOptions(data);
      })
      .catch((err) => toast.error(`Urgency ${err}`));
  }, []);

  // Get data Impact
  const [impactOptions, setImpactOptions] = useState([]);
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/parameters/impact?isActive=Y`)
      .then((response) => {
        const data = response.data.data.map((d) => ({
          value: d.id,
          label: d.impact,
        }));
        setImpactOptions(data);
      })
      .catch((err) => toast.error(`Impact ${err}`));
  }, []);

  // Get data Source Problem
  const [sourceOptions, setSourceOptions] = useState([]);
  useEffect(() => {
    axios
      .get("http://127.0.0.1:3030/v1/probman/source/all")
      .then((response) => {
        const data = response.data.data.map((d) => ({
          value: d.id,
          label: d.label,
        }));
        setSourceOptions(data);
      })
      .catch((err) => toast.error(`Type ${err}`));
  }, []);

  return (
    <>
      <Layout key={`LayoutProblemDetail-${problem.data.id}`} session={user}>
        <Head>
          <title>
            {problem.data.problemNumber}{" "}
            {problem.data.app ? problem.data.app.subname : ""} - Shield
          </title>
        </Head>
        <section>
          <div className="py-6">
            <div className="max-w-full mx-auto px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-full lg:px-12">
              <div className="flex items-center space-x-5">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {problem.data.problemName}
                  </h1>
                  <p className="text-sm font-medium text-gray-500">
                    Created by&nbsp;
                    <a href="#" className="text-gray-900">
                      {problem.data.created_by.fullName
                        ? problem.data.created_by.fullName
                        : problem.data.created_by.userName}
                    </a>{" "}
                    on{" "}
                    <time
                      dateTime={format(
                        new Date(problem.data.createdAt),
                        "d LLLL yyyy hh:mm"
                      )}
                    >
                      {format(
                        new Date(problem.data.createdAt),
                        "d LLLL yyyy hh:mm"
                      )}
                    </time>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-reverse sm:space-y-0 sm:space-x-3 md:mt-0 md:flex-row md:space-x-3">
                <span
                  className={classNames(
                    problem.data.problemStatus.label
                      .toLowerCase()
                      .startsWith("waiting")
                      ? "bg-gray-100 text-gray-800"
                      : problem.data.problemStatus.label
                          .toLowerCase()
                          .startsWith("unassigned")
                      ? "bg-red-100 text-gray-800"
                      : problem.data.problemStatus.label
                          .toLowerCase()
                          .startsWith("ongoing")
                      ? "bg-blue-100 text-gray-800"
                      : problem.data.problemStatus.label
                          .toLowerCase()
                          .startsWith("done")
                      ? "bg-green-100 text-gray-800"
                      : "bg-gray-100 text-gray-800",
                    "inline-flex items-center justify-center px-3 py-0.5 rounded-full text-sm font-medium"
                  )}
                >
                  {problem.data.problemStatus.label}
                </span>
              </div>
            </div>

            <div className="mt-8 max-w-full mx-auto grid grid-cols-1 gap-6 sm:px-6 lg:max-w-full lg:px-12 lg:grid-flow-col-dense lg:grid-cols-3">
              <div className="space-y-6 lg:col-start-1 lg:col-span-2">
                {/* Problem Detail */}
                <section aria-labelledby="problem-detail">
                  <div className="bg-white shadow sm:rounded-lg">
                    {editMode ? (
                      <>
                        <form onSubmit={handleSubmit(onSubmit)}>
                          <section aria-labelledby="edit-problem">
                            <CardTitle
                              title={`Problem Number ${problem.data.problemNumber}`}
                              subtitle={problem.data.diffSLA}
                            >
                              <div className="px-4 flex">
                                <ButtonCircle
                                  action={() => {
                                    setEditMode(false);
                                    reset();
                                  }}
                                  className="border-transparent text-white bg-rose-600 hover:bg-rose-700"
                                >
                                  <XIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </ButtonCircle>
                                <ButtonCircle
                                  action={handleSubmit(onSubmit)}
                                  className={classNames(
                                    isSubmitting
                                      ? "px-4 disabled:opacity-50 cursor-not-allowed"
                                      : "",
                                    "ml-3 border-transparent text-white bg-blue-600 hover:bg-blue-700"
                                  )}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting && <Spinner />}
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </ButtonCircle>
                              </div>
                            </CardTitle>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Problem Name
                                  </label>
                                  <div className="pt-1">
                                    <textarea
                                      id="problemName"
                                      name="problemName"
                                      {...register("problemName", {
                                        required: "This is required!",
                                        minLength: {
                                          value: 5,
                                          message:
                                            "Please lengthen this text to 5 characters or more.",
                                        },
                                      })}
                                      rows={1}
                                      style={{
                                        resize: "none",
                                      }}
                                      className={classNames(
                                        errors.problemName
                                          ? "border-red-300 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 "
                                          : "focus:ring-blue-500 focus:border-blue-500",
                                        "shadow-sm mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                                      )}
                                      placeholder="Problem Happening"
                                      defaultValue={problem.data.problemName}
                                    />
                                    {errors.problemName && (
                                      <p className="mt-1 text-sm text-red-600">
                                        {errors.problemName.message}
                                      </p>
                                    )}
                                  </div>
                                  <p className="pt-2 text-sm text-gray-500">
                                    Edit a few sentences about problem.
                                  </p>
                                </div>

                                <div className="sm:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Application
                                  </label>
                                  <Controller
                                    name="idApps"
                                    control={control}
                                    rules={{ required: "This is required" }}
                                    defaultValue={problem.data.app.id}
                                    render={({ field }) => (
                                      <AsyncSelect
                                        {...field}
                                        isClearable
                                        loadOptions={loadApplications}
                                        styles={styledReactSelectAdd}
                                        className="pt-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Search for application"
                                        components={{ NoOptionsMessage }}
                                      />
                                    )}
                                  />
                                  {errors.idApps && (
                                    <p className="mt-2 text-sm text-red-600">
                                      {errors.idApps.message}
                                    </p>
                                  )}
                                </div>

                                <div className="sm:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Link JIRA
                                  </label>
                                  <div className="pt-1">
                                    <textarea
                                      id="jiraProblem"
                                      name="jiraProblem"
                                      {...register("jiraProblem")}
                                      rows={1}
                                      style={{
                                        resize: "none",
                                      }}
                                      className={classNames(
                                        errors.jiraProblem
                                          ? "border-red-300 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 "
                                          : "focus:ring-blue-500 focus:border-blue-500",
                                        "shadow-sm mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                                      )}
                                      placeholder="Link JIRA"
                                      defaultValue={problem.data.jiraProblem}
                                    />
                                    {errors.jiraProblem && (
                                      <p className="mt-1 text-sm text-red-600">
                                        {errors.jiraProblem.message}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Urgency
                                  </label>
                                  <div className="pt-1">
                                    <Controller
                                      name="idUrgency"
                                      control={control}
                                      rules={{ required: "This is required" }}
                                      render={({ field }) => (
                                        <Select
                                          {...field}
                                          isClearable
                                          options={urgencyOptions}
                                          styles={styledReactSelect}
                                          className="text-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      )}
                                    />
                                    {errors.idUrgency && (
                                      <p className="pt-2 text-sm text-red-600">
                                        {errors.idUrgency.message}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Impact
                                  </label>
                                  <div className="pt-1">
                                    <Controller
                                      name="idImpact"
                                      control={control}
                                      rules={{ required: "This is required" }}
                                      render={({ field }) => (
                                        <Select
                                          {...field}
                                          isClearable
                                          className={classNames(
                                            errors.idImpact
                                              ? "border-red-300 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 "
                                              : "focus:ring-blue-500 focus:border-blue-500",
                                            "block w-full py-2 text-base border-gray-300 sm:text-sm rounded-md"
                                          )}
                                          options={impactOptions}
                                          styles={styledReactSelect}
                                          placeholder="Select impact..."
                                        />
                                      )}
                                    />
                                    {errors.idImpact && (
                                      <p className="text-sm text-red-600">
                                        {errors.idImpact.message}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="sm:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Source
                                  </label>
                                  <div className="pt-1">
                                    <Controller
                                      name="idSource"
                                      control={control}
                                      rules={{ required: "This is required" }}
                                      render={({ field }) => (
                                        <Select
                                          {...field}
                                          isClearable
                                          options={sourceOptions}
                                          styles={styledReactSelect}
                                          className="text-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      )}
                                    />
                                    {errors.idSource && (
                                      <p className="pt-2 text-sm text-red-600">
                                        {errors.idSource.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        </form>
                      </>
                    ) : (
                      <>
                        <CardTitle
                          title={`Problem Number ${problem.data.problemNumber}`}
                          subtitle={problem.data.diffSLA}
                        >
                          <div className="px-4 flex">
                            {user.grant != "viewer" && (
                              <ButtonCircle
                                action={() => {
                                  setEditMode(true);
                                }}
                                className="border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-50"
                              >
                                <PencilIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </ButtonCircle>
                            )}
                          </div>
                        </CardTitle>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Application
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {problem.data.app.subname
                                  ? problem.data.app.subname
                                  : "Not defined yet"}
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Link JIRA
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                <a
                                  href={
                                    problem.data.jiraProblem
                                      ? problem.data.jiraProblem
                                      : "Not defined yet"
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {problem.data.jiraProblem
                                    ? problem.data.jiraProblem
                                    : "Not defined yet"}
                                </a>
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Urgency
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {problem.data.urgency.urgency
                                  ? problem.data.urgency.urgency
                                  : "Not defined yet"}
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Impact
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {problem.data.impact.impact
                                  ? problem.data.impact.impact
                                  : "Not defined yet"}
                              </dd>
                            </div>

                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">
                                Source
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {problem.data.problemSource.label ? (
                                  <SourcePill
                                    value={problem.data.problemSource.label}
                                  />
                                ) : (
                                  "Not defined yet"
                                )}
                              </dd>
                            </div>
                            <div className="sm:col-span-1"></div>
                          </dl>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Condition Incident Table */}
                {problem.data.incidents.length > 0 ? (
                  <section aria-labelledby="incident-table">
                    <div className="bg-white shadow sm:rounded-lg">
                      <table className="min-w-full" role="table">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Number
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Related Incident
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Root Cause
                            </th>
                            <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reported at
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {problem.data.incidents.map((incident) => (
                            <>
                              <tr key={`${incident.incidentNumber}`}>
                                <td className="px-6 py-3 text-sm text-gray-500 font-normal">
                                  <Link
                                    href={`/incidents/${incident.id}`}
                                    passHref
                                  >
                                    <a
                                      className="text-blue-500 hover:text-blue-900"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {incident.incidentNumber}
                                    </a>
                                  </Link>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500 font-normal">
                                  {incident.incidentName}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500 font-normal">
                                  {incident.rootCause ? incident.rootCause : null}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500 font-normal">
                                  {format(
                                    new Date(incident.createdAt),
                                    "d LLLL yyyy hh:mm"
                                  )}
                                </td>
                              </tr>
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}
              </div>

              <section
                aria-labelledby="timeline-title"
                className="lg:col-start-3 lg:col-span-1"
              >
                <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
                  {/* Problem Info */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-medium text-gray-900">
                        Problem Type
                      </h2>
                      <ul className="mt-2 leading-8">
                        <li className="inline">
                          <a
                            href="#"
                            className="relative inline-flex items-center rounded-full border border-gray-300 px-3 py-0.5"
                          >
                            <div className="absolute flex-shrink-0 flex items-center justify-center">
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-rose-500"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3.5 text-sm font-medium text-gray-900">
                              Priority : {problem.data.priorityMatrix.mapping}
                            </div>
                          </a>{" "}
                        </li>
                        <li className="inline">
                          <a
                            href="#"
                            className="relative inline-flex items-center rounded-full border border-gray-300 px-3 py-0.5"
                          >
                            <div className="absolute flex-shrink-0 flex items-center justify-center">
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3.5 text-sm font-medium text-gray-900">
                              Criticality : {problem.data.app.criticalityApp}
                            </div>
                          </a>{" "}
                        </li>
                        <li className="inline">
                          <a
                            href="#"
                            className="relative inline-flex items-center rounded-full border border-gray-300 px-3 py-0.5"
                          >
                            <div className="absolute flex-shrink-0 flex items-center justify-center">
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-yellow-500"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3.5 text-sm font-medium text-gray-900">
                              Type : {problem.data.paramType.type}
                            </div>
                          </a>{" "}
                        </li>
                      </ul>
                    </div>
                    <h2 className="text-sm font-medium text-gray-900">
                      Time Flying
                    </h2>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon
                        className="h-5 w-5 text-rose-600"
                        aria-hidden="true"
                      />
                      <span className="text-gray-900 text-sm">
                        Started on
                        <time
                          dateTime={format(
                            new Date(problem.data.createdAt),
                            "d LLLL yyyy hh:mm"
                          )}
                        >
                          {` ${format(
                            new Date(problem.data.createdAt),
                            "d LLLL yyyy hh:mm"
                          )}`}
                        </time>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon
                        className="h-5 w-5 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span className="text-gray-900 text-sm">
                        Review on{" "}
                        <time
                          dateTime={format(
                            new Date(problem.data.updatedAt),
                            "d LLLL yyyy hh:mm"
                          )}
                        >
                          {` ${format(
                            new Date(problem.data.updatedAt),
                            "d LLLL yyyy hh:mm"
                          )}`}
                        </time>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reporter */}
                <div className="bg-white shadow sm:rounded-lg mt-3">
                  <div className="space-y-4 px-4 py-5 sm:px-6">
                    <h2 className="text-sm font-medium text-gray-900">
                      Assigned To
                    </h2>

                    {problem.data.assigned_to ? (
                      <div className="flex items-center space-x-2">
                        <UserCircleIcon
                          className="h-6 w-6 text-gray-500"
                          aria-hidden="true"
                        />
                        <span className="text-gray-600 text-sm">
                          {problem.data.assigned_to.fullName}
                        </span>
                      </div>
                    ) : user.username === "haritsf" ? (
                      <>
                        <form onSubmit={handleSubmit(makeAssign)}>
                          <Controller
                            name="assignedTo"
                            control={control}
                            // rules={{ required: "This is required" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                isClearable
                                options={assignOptions}
                                styles={styledReactSelect}
                                className="block w-60 text-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                          <button
                            type="submit"
                            className="mt-4 w-60 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Submit
                          </button>
                          {errors.assignedTo && (
                            <p className="pt-2 text-sm text-red-600">
                              {errors.assignedTo.message}
                            </p>
                          )}
                        </form>
                      </>
                    ) : (
                      "Not Assigned"
                    )}

                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm">
                        Last updated on{" "}
                        {problem.data.updatedAt
                          ? format(
                              new Date(problem.data.updatedAt),
                              "dd MMM yyyy HH:mm",
                              "id-ID"
                            )
                          : format(
                              new Date(problem.data.createdAt),
                              "dd MMM yyyy HH:mm",
                              "id-ID"
                            )}{" "}
                        <br />
                        by{" "}
                        {problem.data.updated_by
                          ? problem.data.updated_by.fullName
                          : problem.data.updated_by.fullName}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}

export default ProblemDetail;
