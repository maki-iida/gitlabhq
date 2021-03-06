# frozen_string_literal: true

require 'faker'

module QA
  RSpec.describe 'Verify', :runner, :requires_admin do
    # [TODO]: Developer to remove :requires_admin once FF is removed in follow up issue

    describe "Trigger child pipeline with 'when:manual'" do
      let(:feature_flag) { :ci_manual_bridges } # [TODO]: Developer to remove when feature flag is removed
      let(:executor) { "qa-runner-#{Faker::Alphanumeric.alphanumeric(8)}" }

      let(:project) do
        Resource::Project.fabricate_via_api! do |project|
          project.name = 'project-with-pipeline'
        end
      end

      let!(:runner) do
        Resource::Runner.fabricate! do |runner|
          runner.project = project
          runner.name = executor
          runner.tags = [executor]
        end
      end

      before do
        Runtime::Feature.enable(feature_flag) # [TODO]: Developer to remove when feature flag is removed
        Flow::Login.sign_in
        add_ci_files
        project.visit!
        view_the_last_pipeline
      end

      after do
        Runtime::Feature.disable(feature_flag) # [TODO]: Developer to remove when feature flag is removed
        runner.remove_via_api!
      end

      it 'can trigger bridge job', testcase: 'https://gitlab.com/gitlab-org/quality/testcases/-/issues/1049' do
        Page::Project::Pipeline::Show.perform do |parent_pipeline|
          expect(parent_pipeline).not_to have_child_pipeline

          parent_pipeline.click_job_action('trigger')
          Support::Waiter.wait_until { parent_pipeline.has_child_pipeline? }
          parent_pipeline.expand_child_pipeline

          expect(parent_pipeline).to have_build('child_build', status: nil)
        end
      end

      private

      def add_ci_files
        Resource::Repository::Commit.fabricate_via_api! do |commit|
          commit.project = project
          commit.commit_message = 'Add parent and child pipelines CI files.'
          commit.add_files(
            [
              child_ci_file,
              parent_ci_file
            ]
          )
        end
      end

      def view_the_last_pipeline
        Page::Project::Menu.perform(&:click_ci_cd_pipelines)
        Page::Project::Pipeline::Index.perform(&:wait_for_latest_pipeline_success)
        Page::Project::Pipeline::Index.perform(&:click_on_latest_pipeline)
      end

      def parent_ci_file
        {
          file_path: '.gitlab-ci.yml',
          content: <<~YAML
            build:
              stage: build
              tags: ["#{executor}"]
              script: echo build

            trigger:
              stage: test
              when: manual
              trigger:
                include: '.child-pipeline.yml'

            deploy:
              stage: deploy
              tags: ["#{executor}"]
              script: echo deploy
          YAML
        }
      end

      def child_ci_file
        {
          file_path: '.child-pipeline.yml',
          content: <<~YAML
            child_build:
              stage: build
              tags: ["#{executor}"]
              script: echo build
          YAML
        }
      end
    end
  end
end
