-- Cheap change tokens prevent re-reading unchanged message/reaction histories.
CREATE TABLE IF NOT EXISTS wibs_revisions(scope TEXT NOT NULL,target TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(scope,target));
CREATE TRIGGER IF NOT EXISTS wibs_community_insert AFTER INSERT ON community_messages BEGIN
 INSERT INTO wibs_revisions VALUES('community',NEW.channel_id,1) ON CONFLICT(scope,target) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS wibs_community_delete AFTER DELETE ON community_messages BEGIN
 INSERT INTO wibs_revisions VALUES('community',OLD.channel_id,1) ON CONFLICT(scope,target) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS wibs_community_reaction_insert AFTER INSERT ON community_reactions BEGIN
 INSERT INTO wibs_revisions SELECT 'community',channel_id,1 FROM community_messages WHERE id=NEW.message_id ON CONFLICT(scope,target) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS wibs_community_reaction_update AFTER UPDATE ON community_reactions BEGIN
 UPDATE wibs_revisions SET revision=revision+1 WHERE scope='community' AND target=(SELECT channel_id FROM community_messages WHERE id=NEW.message_id);
END;
CREATE TRIGGER IF NOT EXISTS wibs_community_reaction_delete AFTER DELETE ON community_reactions BEGIN
 UPDATE wibs_revisions SET revision=revision+1 WHERE scope='community' AND target=(SELECT channel_id FROM community_messages WHERE id=OLD.message_id);
END;
CREATE TRIGGER IF NOT EXISTS wibs_dm_insert AFTER INSERT ON social_messages BEGIN
 INSERT INTO wibs_revisions VALUES('dm',NEW.conversation_id,1) ON CONFLICT(scope,target) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS wibs_dm_reaction_insert AFTER INSERT ON social_message_reactions BEGIN
 INSERT INTO wibs_revisions SELECT 'dm',conversation_id,1 FROM social_messages WHERE id=NEW.message_id ON CONFLICT(scope,target) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS wibs_dm_reaction_update AFTER UPDATE ON social_message_reactions BEGIN
 UPDATE wibs_revisions SET revision=revision+1 WHERE scope='dm' AND target=(SELECT conversation_id FROM social_messages WHERE id=NEW.message_id);
END;
CREATE TRIGGER IF NOT EXISTS wibs_dm_reaction_delete AFTER DELETE ON social_message_reactions BEGIN
 UPDATE wibs_revisions SET revision=revision+1 WHERE scope='dm' AND target=(SELECT conversation_id FROM social_messages WHERE id=OLD.message_id);
END;
-- Reactions on pre-existing messages also have a revision to increment.
INSERT OR IGNORE INTO wibs_revisions SELECT 'community',id,0 FROM community_channels;
INSERT OR IGNORE INTO wibs_revisions SELECT 'dm',id,0 FROM social_conversations;
CREATE INDEX IF NOT EXISTS achievement_unlocks_by_achievement ON dashboard_achievement_unlocks(achievement_id,username);
