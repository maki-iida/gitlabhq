# frozen_string_literal: true

module Projects
  module HashedStorage
    class MigrateRepositoryService < BaseRepositoryService
      def execute
        try_to_set_repository_read_only!

        @old_storage_version = project.storage_version
        project.storage_version = ::Project::HASHED_STORAGE_FEATURES[:repository]

        @new_disk_path = project.disk_path

        result = move_repositories

        if result
          project.write_repository_config
          project.track_project_repository
        else
          rollback_folder_move
          project.storage_version = nil
        end

        project.transaction do
          project.save!(validate: false)
          project.set_repository_writable!
        end

        if result && block_given?
          yield
        end

        result
      end
    end
  end
end

Projects::HashedStorage::MigrateRepositoryService.prepend_if_ee('EE::Projects::HashedStorage::MigrateRepositoryService')
