# frozen_string_literal: true

module API
  class Lint < ::API::Base
    feature_category :pipeline_authoring

    namespace :ci do
      desc 'Validation of .gitlab-ci.yml content'
      params do
        requires :content, type: String, desc: 'Content of .gitlab-ci.yml'
        optional :include_merged_yaml, type: Boolean, desc: 'Whether or not to include merged CI config yaml in the response'
      end
      post '/lint' do
        result = Gitlab::Ci::YamlProcessor.new(params[:content], user: current_user).execute
        error = result.errors.first

        status 200

        response = if error.blank?
                     { status: 'valid', errors: [] }
                   else
                     { status: 'invalid', errors: [error] }
                   end

        response.tap do |response|
          response[:merged_yaml] = result.merged_yaml if params[:include_merged_yaml]
        end
      end
    end

    resource :projects, requirements: API::NAMESPACE_OR_PROJECT_REQUIREMENTS do
      desc 'Validation of .gitlab-ci.yml content' do
        detail 'This feature was introduced in GitLab 13.5.'
      end
      params do
        optional :dry_run, type: Boolean, default: false, desc: 'Run pipeline creation simulation, or only do static check.'
      end
      get ':id/ci/lint' do
        authorize! :download_code, user_project

        content = user_project.repository.gitlab_ci_yml_for(user_project.commit.id, user_project.ci_config_path_or_default)
        result = Gitlab::Ci::Lint
          .new(project: user_project, current_user: current_user)
          .validate(content, dry_run: params[:dry_run])

        present result, with: Entities::Ci::Lint::Result, current_user: current_user
      end
    end
  end
end
