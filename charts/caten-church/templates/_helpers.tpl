{{/*
Expand the name of the chart.
*/}}
{{- define "caten-church.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "caten-church.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "caten-church.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "caten-church.labels" -}}
helm.sh/chart: {{ include "caten-church.chart" . }}
{{ include "caten-church.selectorLabels" . }}
app.kubernetes.io/version: {{ (default .Chart.AppVersion .Values.image.tag) | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "caten-church.selectorLabels" -}}
app.kubernetes.io/name: {{ include "caten-church.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "caten-church.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "caten-church.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "caten-church.image" -}}
{{ .Values.image.repository }}:{{ default .Chart.AppVersion .Values.image.tag }}
{{- end }}

{{/* Name of the Secret holding app secrets, empty when there is none. */}}
{{- define "caten-church.secretName" -}}
{{- if .Values.existingSecret }}
{{- .Values.existingSecret }}
{{- else if .Values.secrets }}
{{- include "caten-church.fullname" . }}
{{- end }}
{{- end }}

{{/*
ConfigMap/Secret created by the chart are also Helm hooks when migrations run,
so they already exist when the pre-install migration Job starts.
pre-rollback re-renders them from the target revision on `helm rollback`.
Hook resources are not removed by `helm uninstall` (see NOTES.txt).
*/}}
{{- define "caten-church.configHookAnnotations" -}}
{{- if .Values.migrations.enabled }}
annotations:
  helm.sh/hook: pre-install,pre-upgrade,pre-rollback
  helm.sh/hook-weight: "-10"
  helm.sh/hook-delete-policy: before-hook-creation
{{- end }}
{{- end }}

{{/* Environment shared by all app containers. */}}
{{- define "caten-church.envFrom" -}}
envFrom:
  - configMapRef:
      name: {{ include "caten-church.fullname" . }}
  {{- with include "caten-church.secretName" . }}
  - secretRef:
      name: {{ . }}
  {{- end }}
{{- end }}

{{/* Pod-level settings shared by all app pods. */}}
{{- define "caten-church.podSpecCommon" -}}
{{- with .Values.imagePullSecrets }}
imagePullSecrets:
  {{- toYaml . | nindent 2 }}
{{- end }}
serviceAccountName: {{ include "caten-church.serviceAccountName" . }}
securityContext:
  {{- toYaml .Values.podSecurityContext | nindent 2 }}
{{- end }}

{{/* Checksums so pods restart when config changes. */}}
{{- define "caten-church.configChecksums" -}}
checksum/config: {{ toYaml .Values.env | sha256sum }}
checksum/secret: {{ toYaml .Values.secrets | sha256sum }}
{{- end }}
